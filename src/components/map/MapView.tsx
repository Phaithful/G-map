// src/components/map/MapView.tsx
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { renderToStaticMarkup } from "react-dom/server";
import type { Location } from "../../types";

import {
  GraduationCap,
  Building2,
  Home,
  Utensils,
  HeartPulse,
  Church,
  Dumbbell,
  ShoppingBag,
} from "lucide-react";

import { buildCampusRouteGeoJSON, buildRouteSteps } from "../../lib/campusRouting";
import type { CampusGraph, RouteStep } from "../../lib/campusRouting";
import campusGraph from "../../data/campusGraph.json";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

interface MapViewProps {
  locations?: Location[];
  selectedLocation?: Location | null;
  onPinClick?: (location: Location) => void;

  userLocation?: { lat: number; lng: number } | null;
  userLocationRef?: React.MutableRefObject<{ lat: number; lng: number } | null>;

  headingRef?: React.MutableRefObject<number | null>;

  routeActive?: boolean;
  hideOtherPins?: boolean;

  activeDestination?: Location | null;
  routeProfile?: "walking" | "driving" | "cycling";

  onArrive?: (destination: Location) => void;
  onProgress?: (info: { distanceM: number; durationS: number; stepIndex: number }) => void;
  onOffRoute?: () => void;
}

// ------------------------
// Helpers (Pins)
// ------------------------
const CATEGORY_ICONS: Record<string, typeof GraduationCap> = {
    academics: GraduationCap,
  offices:   Building2,
  hostels:   Home,
  food:      Utensils,
  health:    HeartPulse,
  churches:  Church,
  sports:    Dumbbell,
  shops:     ShoppingBag,
};

const CATEGORY_COLORS: Record<string, string> = {
    academics: "#3b82f6",
  offices:   "#64748b",
  hostels:   "#8b5cf6",
  food:      "#f97316",
  health:    "#ef4444",
  churches:  "#d97706",
  sports:    "#10b981",
  shops:     "#ec4899",
  };

const getCategoryIcon  = (c: string) => CATEGORY_ICONS[c]  || GraduationCap;
const getCategoryColor = (c: string) => CATEGORY_COLORS[c] || "#2563eb";

// Cache rendered SVG strings — icons never change, so we only call
// renderToStaticMarkup once per category (8 categories total).
const _iconHtmlCache = new Map<string, string>();
function getCategoryIconHtml(category: string): string {
  if (_iconHtmlCache.has(category)) return _iconHtmlCache.get(category)!;
  const Icon = getCategoryIcon(category);
  const html = renderToStaticMarkup(React.createElement(Icon, { size: 16, color: "white" }));
  _iconHtmlCache.set(category, html);
  return html;
}

// ------------------------
// Helpers (Geo / Cone)
// ------------------------
const USER_CONE_SOURCE_ID = "gmap-user-cone-source";
const USER_CONE_LAYER_ID = "gmap-user-cone-layer";
const USER_CONE_OUTLINE_ID = "gmap-user-cone-outline-layer";

const BUILDINGS_SOURCE_ID = "gmap-buildings-source";
const BUILDINGS_LAYER_ID = "gmap-buildings-3d-layer";

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

function normalize360(deg: number) {
  const v = deg % 360;
  return v < 0 ? v + 360 : v;
}

function shortestAngleDelta(a: number, b: number) {
  const da = normalize360(a);
  const db = normalize360(b);
  let d = db - da;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

function destPoint(lat: number, lng: number, bearingDeg: number, distanceM: number) {
  const R = 6371000;
  const brng = toRad(bearingDeg);
  const φ1 = toRad(lat);
  const λ1 = toRad(lng);
  const δ = distanceM / R;

  const sinφ1 = Math.sin(φ1);
  const cosφ1 = Math.cos(φ1);
  const sinδ = Math.sin(δ);
  const cosδ = Math.cos(δ);

  const sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * Math.cos(brng);
  const φ2 = Math.asin(sinφ2);

  const y = Math.sin(brng) * sinδ * cosφ1;
  const x = cosδ - sinφ1 * sinφ2;
  const λ2 = λ1 + Math.atan2(y, x);

  return { lat: toDeg(φ2), lng: toDeg(λ2) };
}

function buildConePolygon(args: {
  center: { lat: number; lng: number };
  bearing: number;
  radiusM: number;
  halfAngleDeg: number;
  steps?: number;
}) {
  const { center, bearing, radiusM, halfAngleDeg, steps = 7 } = args;
  const start = bearing - halfAngleDeg;
  const end = bearing + halfAngleDeg;

  const coords: [number, number][] = [];
  coords.push([center.lng, center.lat]);

  for (let i = 0; i <= steps; i++) {
    const b = start + ((end - start) * i) / steps;
    const p = destPoint(center.lat, center.lng, b, radiusM);
    coords.push([p.lng, p.lat]);
  }

  coords.push([center.lng, center.lat]);

  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "Polygon" as const, coordinates: [coords] },
  };
}

function approxMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = (b.lat - a.lat) * 111320;
  const dLng = (b.lng - a.lng) * 111320 * Math.cos(toRad(a.lat));
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

// ------------------------
// ✅ Distance helper (used for dotted + arrival)
// ------------------------
function haversineMeters(a: { lng: number; lat: number }, b: { lng: number; lat: number }) {
  const R = 6371000;
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const dφ = toRad(b.lat - a.lat);
  const dλ = toRad(b.lng - a.lng);

  const x =
    Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(x));
}

// ------------------------
// ✅ Curvy dotted connector (presentation)
// ------------------------
function mulberry32(seed: number) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function makeCurvyConnector(args: {
  from: { lng: number; lat: number };
  to: { lng: number; lat: number };
  seed: number;
}) {
  const { from, to, seed } = args;
  const rand = mulberry32(seed);

  const dist = haversineMeters(from, to);
  const points = clamp(Math.round(dist / 25) + 6, 8, 14);
  const ampMax = clamp(dist * 0.18, 10, 40);

  const lat0 = (from.lat + to.lat) / 2;
  const mToLat = 1 / 111320;
  const mToLng = 1 / (111320 * Math.cos(toRad(lat0)));

  const dx = (to.lng - from.lng) / mToLng;
  const dy = (to.lat - from.lat) / mToLat;
  const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));

  const px = -dy / len;
  const py = dx / len;

  const bend1 = (rand() * 2 - 1) * 0.9;
  const bend2 = (rand() * 2 - 1) * 0.9;

  const coords: Array<[number, number]> = [];
  coords.push([from.lng, from.lat]);

  for (let i = 1; i < points - 1; i++) {
    const t = i / (points - 1);

    const baseLng = from.lng + (to.lng - from.lng) * t;
    const baseLat = from.lat + (to.lat - from.lat) * t;

    const envelope = Math.sin(Math.PI * t);
    const wave =
      Math.sin(t * Math.PI * 1.0 + bend1) * 0.65 +
      Math.sin(t * Math.PI * 2.0 + bend2) * 0.35;

    const offsetM = envelope * ampMax * wave;

    coords.push([
      baseLng + px * offsetM * mToLng,
      baseLat + py * offsetM * mToLat,
    ]);
  }

  coords.push([to.lng, to.lat]);
  return coords;
}

// ------------------------
// ✅ Routing source (single source, 2 layers)
// ------------------------
const ROUTE_SOURCE_ID = "gmap-route-source";
const ROUTE_SOLID_LAYER_ID = "gmap-route-solid-layer";
const ROUTE_DOT_LAYER_ID = "gmap-route-dot-layer";

function upsertRouteCollection(
  map: mapboxgl.Map,
  args: {
    solid?: Array<[number, number]>;
    dottedSegments?: Array<Array<[number, number]>>;
  },
) {
  const features: any[] = [];

  if (args.solid && args.solid.length >= 2) {
    features.push({
      type: "Feature",
      properties: { kind: "solid" },
      geometry: { type: "LineString", coordinates: args.solid },
    });
  }

  if (args.dottedSegments && args.dottedSegments.length) {
    for (const seg of args.dottedSegments) {
      if (!seg || seg.length < 2) continue;
      features.push({
        type: "Feature",
        properties: { kind: "dotted" },
        geometry: { type: "LineString", coordinates: seg },
      });
    }
  }

  const fc = { type: "FeatureCollection", features };

  const existing = map.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
  if (existing) {
    existing.setData(fc as any);
    return;
  }

  map.addSource(ROUTE_SOURCE_ID, { type: "geojson", data: fc as any });

  map.addLayer({
    id: ROUTE_SOLID_LAYER_ID,
    type: "line",
    source: ROUTE_SOURCE_ID,
    filter: ["==", ["get", "kind"], "solid"],
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-width": 5, "line-opacity": 0.95, "line-color": "#2563eb" },
  });

  map.addLayer({
    id: ROUTE_DOT_LAYER_ID,
    type: "line",
    source: ROUTE_SOURCE_ID,
    filter: ["==", ["get", "kind"], "dotted"],
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-width": 5,
      "line-opacity": 0.95,
      "line-color": "#2563eb",
      "line-dasharray": [0.8, 1.25],
    },
  });
}

function removeRoute(map: mapboxgl.Map) {
  if (map.getLayer(ROUTE_DOT_LAYER_ID)) map.removeLayer(ROUTE_DOT_LAYER_ID);
  if (map.getLayer(ROUTE_SOLID_LAYER_ID)) map.removeLayer(ROUTE_SOLID_LAYER_ID);
  if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);
}

// ------------------------
// Mapbox directions (with snapped endpoints)
// ------------------------
async function fetchDirectionsWithSnap(args: {
  from: { lng: number; lat: number };
  to: { lng: number; lat: number };
  profile: "walking" | "driving" | "cycling";
}) {
  const { from, to, profile } = args;
  const token = mapboxgl.accessToken;

  const url =
    `https://api.mapbox.com/directions/v5/mapbox/${profile}/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?geometries=geojson&overview=full&steps=false&access_token=${token}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch route");
  const data = await res.json();

  const coords = data?.routes?.[0]?.geometry?.coordinates as Array<[number, number]> | undefined;
  const w0 = data?.waypoints?.[0]?.location as [number, number] | undefined;
  const w1 = data?.waypoints?.[1]?.location as [number, number] | undefined;

  if (!coords || coords.length < 2 || !w0 || !w1) throw new Error("No route found");

  return {
    coords,
    snappedStart: { lng: w0[0], lat: w0[1] },
    snappedEnd: { lng: w1[0], lat: w1[1] },
  };
}

// ------------------------
// Campus bounds
// ------------------------
const CAMPUS_BOUNDS_EXPANDED: [[number, number], [number, number]] = [
  [7.524319, 6.4653693],
  [7.5321792, 6.4732641],
];

const MapView = ({
  locations = [],
  onPinClick,
  userLocation,
  userLocationRef,
  headingRef,
  routeActive = false,
  hideOtherPins = false,
  activeDestination = null,
  routeProfile = "walking",
  onArrive,
  onProgress,
  onOffRoute,
}: MapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const markersByIdRef = useRef<Record<string, mapboxgl.Marker>>({});
  const lastRouteUpdateRef = useRef<number>(0);

  const puckMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const targetPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const displayPosRef = useRef<{ lat: number; lng: number } | null>(null);

  const rafRef = useRef<number | null>(null);
  const lastVizUpdateRef = useRef<number>(0);
  const lastGoodPosRef = useRef<{ lat: number; lng: number } | null>(null);

  const smoothHeadingRef = useRef<number>(0);
  const hasSmoothHeadingRef = useRef<boolean>(false);

  const lastCameraUpdateRef = useRef<number>(0);

  const followUserRef = useRef<boolean>(true);
  const startedRef = useRef<boolean>(false);

  // ✅ persistent seed: changes ONLY when you “search a new location”
  const routeSeedRef = useRef<number>(123456789);
  const lastDestIdRef = useRef<string | null>(null);
  const lastRouteActiveRef = useRef<boolean>(false);

  // ✅ arrival refs
  const arrivedRef = useRef<boolean>(false);
  const lastArrivalCheckRef = useRef<number>(0);

  // ✅ progress & off-route refs
  const routeCoordsRef = useRef<[number, number][]>([]);
  const routeStepsRef = useRef<RouteStep[]>([]);
  const lastProgressUpdateRef = useRef<number>(0);
  const lastOffRouteCheckRef = useRef<number>(0);
  const offRouteCooldownRef = useRef<number>(0);

  useEffect(() => {
    startedRef.current = hideOtherPins;
    if (hideOtherPins) followUserRef.current = true;
  }, [hideOtherPins]);

  // ✅ Update the seed ONLY when route starts OR destination changes
  // Also reset "arrived" state here.
  useEffect(() => {
    const destId = activeDestination?.id ? String(activeDestination.id) : null;

    const routeJustStarted = routeActive && !lastRouteActiveRef.current;
    const destinationChanged = routeActive && destId && destId !== lastDestIdRef.current;

    if (routeJustStarted || destinationChanged) {
      routeSeedRef.current = ((Date.now() ^ (Math.random() * 1e9)) >>> 0) || 123456789;
      arrivedRef.current = false; // ✅ reset arrival for new navigation
    }

    if (!routeActive) {
      arrivedRef.current = false; // ✅ reset when routing stops
    }

    lastRouteActiveRef.current = routeActive;
    lastDestIdRef.current = destId;
  }, [routeActive, activeDestination?.id]);

  // Init map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [7.526536274555406, 6.468611159365743],
      zoom: 15,
      minZoom: 12,
      maxZoom: 19,
    });

    map.touchZoomRotate.enable();
    map.dragRotate.enable();

    const stopFollowing = () => {
      followUserRef.current = false;
    };
    map.on("dragstart", stopFollowing);
    map.on("zoomstart", stopFollowing);
    map.on("rotatestart", stopFollowing);
    map.on("pitchstart", stopFollowing);

    // Auto-pitch: smoothly tilt into 3D after the zoom gesture settles
    const handleZoomPitch = () => {
      const z = map.getZoom();
      let pitch = 0;
      if (z >= 17.5) {
        pitch = 50;
      } else if (z > 15.5) {
        pitch = ((z - 15.5) / 2) * 50;
      }
      // easeTo lets Mapbox animate pitch without fighting the zoom gesture
      map.easeTo({ pitch, duration: 500, easing: (t) => t * (2 - t) });
    };
    map.on("zoomend", handleZoomPitch);

    const styleEl = document.createElement("style");
    styleEl.setAttribute("data-gmap", "hide-mapbox-user-dot");
    styleEl.innerHTML = `
      .mapboxgl-user-location,
      .mapboxgl-user-location-dot,
      .mapboxgl-user-location-accuracy-circle,
      .mapboxgl-user-location-heading {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }
    `;
    document.head.appendChild(styleEl);

    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
      showAccuracyCircle: true,
      fitBoundsOptions: { maxZoom: 18 },
    });

    map.addControl(geolocate, "top-left");
    map.on("load", () => {
      geolocate.trigger();

      // Load campus building footprints and render as 3D extrusions
      fetch("/buildings-merged.geojson")
        .then((r) => r.json())
        .then((data) => {
          if (map.getSource(BUILDINGS_SOURCE_ID)) return;
          map.addSource(BUILDINGS_SOURCE_ID, { type: "geojson", data });
          map.addLayer({
            id: BUILDINGS_LAYER_ID,
            type: "fill-extrusion",
            source: BUILDINGS_SOURCE_ID,
            paint: {
              // Subtle sage-green tint to match the app's colour palette
              "fill-extrusion-color": "#c8d4bf",
              "fill-extrusion-height": ["get", "height"],
              "fill-extrusion-base": 0,
              // Fade buildings in as the user zooms toward 3D range
              "fill-extrusion-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15.5, 0,
                16.5, 0.82,
              ],
            },
          });
        })
        .catch(() => {}); // silent – map still works without 3D buildings
    });

    geolocate.on("geolocate", (e) => {
      const { latitude, longitude } = e.coords;

      const insideCampus =
        longitude >= 7.525675 &&
        longitude <= 7.5308232 &&
        latitude >= 6.4667163 &&
        latitude <= 6.4719171;

      if (insideCampus) map.setMaxBounds(CAMPUS_BOUNDS_EXPANDED);
    });

    mapRef.current = map;

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      puckMarkerRef.current?.remove();
      puckMarkerRef.current = null;

      try {
        if (map.getLayer(USER_CONE_OUTLINE_ID)) map.removeLayer(USER_CONE_OUTLINE_ID);
        if (map.getLayer(USER_CONE_LAYER_ID)) map.removeLayer(USER_CONE_LAYER_ID);
        if (map.getSource(USER_CONE_SOURCE_ID)) map.removeSource(USER_CONE_SOURCE_ID);
      } catch {}

      try {
        removeRoute(map);
      } catch {}

      document.querySelector('style[data-gmap="hide-mapbox-user-dot"]')?.remove();

      map.off("dragstart", stopFollowing);
      map.off("zoomstart", stopFollowing);
      map.off("rotatestart", stopFollowing);
      map.off("pitchstart", stopFollowing);
      map.off("zoomend", handleZoomPitch);

      try {
        if (map.getLayer(BUILDINGS_LAYER_ID)) map.removeLayer(BUILDINGS_LAYER_ID);
        if (map.getSource(BUILDINGS_SOURCE_ID)) map.removeSource(BUILDINGS_SOURCE_ID);
      } catch {}

      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Render POI markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    Object.values(markersByIdRef.current).forEach((m) => m.remove());
    markersByIdRef.current = {};

    const destId = activeDestination?.id ? String(activeDestination.id) : null;

    const renderList: Location[] = hideOtherPins
      ? destId
        ? locations.filter((l) => String(l.id) === destId)
        : []
      : locations;

    renderList.forEach((location) => {
      const el = document.createElement("div");
      const color = getCategoryColor(location.category);

      el.style.cssText =
        "width:32px;height:32px;border-radius:50%;display:flex;align-items:center;" +
        "justify-content:center;border:2px solid white;cursor:pointer;" +
        `background:${color};box-shadow:0 2px 6px rgba(0,0,0,0.22);`;

      el.innerHTML = getCategoryIconHtml(location.category);
      el.onclick = () => onPinClick?.(location);

      const marker = new mapboxgl.Marker(el).setLngLat([location.lng, location.lat]).addTo(map);
      markersByIdRef.current[String(location.id)] = marker;
    });
  }, [locations, onPinClick, hideOtherPins, activeDestination]);

  // RAF loop: puck + cone + optional follow + ✅ arrival detection
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!puckMarkerRef.current) {
      const el = document.createElement("div");
      el.style.width = "16px";
      el.style.height = "16px";
      el.style.borderRadius = "999px";
      el.style.background = "#2563eb";
      el.style.border = "2px solid rgba(255,255,255,0.95)";
      el.style.boxShadow = "0 6px 14px rgba(0,0,0,0.22)";
      el.style.cursor = "default";
      el.style.position = "relative";

      const dot = document.createElement("div");
      dot.style.width = "6px";
      dot.style.height = "6px";
      dot.style.borderRadius = "999px";
      dot.style.background = "white";
      dot.style.position = "absolute";
      dot.style.left = "50%";
      dot.style.top = "50%";
      dot.style.transform = "translate(-50%, -50%)";
      el.appendChild(dot);

      puckMarkerRef.current = new mapboxgl.Marker({
        element: el,
        rotationAlignment: "map",
        pitchAlignment: "map",
      })
        .setLngLat([7.526536274555406, 6.468611159365743])
        .addTo(map);
    }

    const tick = () => {
      const latestPos = userLocationRef?.current ?? userLocation;

      if (latestPos) {
        const lastGood = lastGoodPosRef.current;
        if (!lastGood || approxMeters(lastGood, latestPos) <= 35) {
          lastGoodPosRef.current = latestPos;
          targetPosRef.current = latestPos;
          if (!displayPosRef.current) displayPosRef.current = latestPos;
        }
      }

      const target = targetPosRef.current;
      const display = displayPosRef.current;

      if (target && display && puckMarkerRef.current) {
        const posSmooth = 0.14;
        const next = {
          lat: display.lat + (target.lat - display.lat) * posSmooth,
          lng: display.lng + (target.lng - display.lng) * posSmooth,
        };
        displayPosRef.current = next;
        puckMarkerRef.current.setLngLat([next.lng, next.lat]);

        // ✅ arrival check (fast but throttled, and only once)
        if (routeActive && activeDestination && !arrivedRef.current) {
          const now = performance.now();
          if (now - lastArrivalCheckRef.current > 500) {
            lastArrivalCheckRef.current = now;

            const dist = haversineMeters(
              { lng: next.lng, lat: next.lat },
              { lng: activeDestination.lng, lat: activeDestination.lat },
            );

            const arrivalRadius =
              routeProfile === "driving" ? 30 : routeProfile === "cycling" ? 22 : 18;

            if (dist <= arrivalRadius) {
              arrivedRef.current = true;

              // immediately wipe the blue line — don't wait for React useEffect
              try { removeRoute(map); } catch {}
              routeCoordsRef.current = [];
              routeStepsRef.current = [];

              // vibrate if supported (quick feedback)
              try {
                navigator.vibrate?.([120, 80, 120]);
              } catch {}

              // let parent show toast/modal
              onArrive?.(activeDestination);

              // broadcast event for global UI listeners (optional)
              window.dispatchEvent(
                new CustomEvent("gmap:arrived", {
                  detail: { destination: activeDestination, distanceMeters: dist },
                }),
              );

              // fallback if no UI handler
              if (!onArrive) {
                alert(`You have arrived at ${activeDestination.name}`);
              }
            }
          }
        }

        // ✅ Live progress tracking (every 2 s)
        if (routeActive && !arrivedRef.current && routeCoordsRef.current.length > 1) {
          const nowMs = performance.now();
          if (nowMs - lastProgressUpdateRef.current > 2000) {
            lastProgressUpdateRef.current = nowMs;

            const rc = routeCoordsRef.current;
            // Find segment of route closest to user
            let minDist = Infinity;
            let closestSegIdx = 0;
            for (let i = 0; i < rc.length - 1; i++) {
              const ax = rc[i][0], ay = rc[i][1];
              const bx = rc[i + 1][0], by = rc[i + 1][1];
              const dx = bx - ax, dy = by - ay;
              const lenSq = dx * dx + dy * dy;
              const t = lenSq > 0
                ? Math.max(0, Math.min(1, ((next.lng - ax) * dx + (next.lat - ay) * dy) / lenSq))
                : 0;
              const px = ax + t * dx, py = ay + t * dy;
              const d = haversineMeters({ lng: next.lng, lat: next.lat }, { lng: px, lat: py });
              if (d < minDist) { minDist = d; closestSegIdx = i; }
            }

            // Sum remaining distance from closest point to destination
            const projEnd = rc[closestSegIdx + 1];
            let remaining = haversineMeters(
              { lng: next.lng, lat: next.lat },
              { lng: projEnd[0], lat: projEnd[1] },
            );
            for (let i = closestSegIdx + 1; i < rc.length - 1; i++) {
              remaining += haversineMeters(
                { lng: rc[i][0], lat: rc[i][1] },
                { lng: rc[i + 1][0], lat: rc[i + 1][1] },
              );
            }

            // Determine current step by finding the last step whose startCoord we've passed
            const steps = routeStepsRef.current;
            let stepIndex = 0;
            for (let s = 0; s < steps.length - 1; s++) {
              const sc = steps[s].startCoord;
              const dStep = haversineMeters({ lng: next.lng, lat: next.lat }, { lng: sc[0], lat: sc[1] });
              const dNext = haversineMeters(
                { lng: next.lng, lat: next.lat },
                { lng: steps[s + 1].startCoord[0], lat: steps[s + 1].startCoord[1] },
              );
              if (dNext < dStep) stepIndex = s + 1;
            }

            onProgress?.({ distanceM: remaining, durationS: remaining / 1.35, stepIndex });

            // ✅ Off-route detection (every 3 s, with 30 s cooldown after trigger)
            if (nowMs - lastOffRouteCheckRef.current > 3000) {
              lastOffRouteCheckRef.current = nowMs;
              if (minDist > 45 && nowMs > offRouteCooldownRef.current) {
                offRouteCooldownRef.current = nowMs + 30000;
                onOffRoute?.();
              }
            }
          }
        }

        const raw = headingRef?.current ?? null;
        if (typeof raw === "number") {
          if (!hasSmoothHeadingRef.current) {
            smoothHeadingRef.current = normalize360(raw);
            hasSmoothHeadingRef.current = true;
          } else {
            const cur = smoothHeadingRef.current;
            const delta = shortestAngleDelta(cur, raw);
            const rotSmooth = 0.22;
            smoothHeadingRef.current = normalize360(cur + delta * rotSmooth);
          }
        } else {
          hasSmoothHeadingRef.current = false;
        }

        const now = performance.now();

        if (map.isStyleLoaded() && now - lastVizUpdateRef.current > 80) {
          lastVizUpdateRef.current = now;

          const bearing = hasSmoothHeadingRef.current ? smoothHeadingRef.current : 0;

          const cone = buildConePolygon({
            center: { lat: next.lat, lng: next.lng },
            bearing,
            radiusM: 45,
            halfAngleDeg: 45,
            steps: 7,
          });

          const coneSrc = map.getSource(USER_CONE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;

          if (coneSrc) {
            coneSrc.setData(cone as any);
          } else if (!map.getSource(USER_CONE_SOURCE_ID)) {
            map.addSource(USER_CONE_SOURCE_ID, { type: "geojson", data: cone as any });

            map.addLayer({
              id: USER_CONE_LAYER_ID,
              type: "fill",
              source: USER_CONE_SOURCE_ID,
              paint: { "fill-color": "#2563eb", "fill-opacity": 0.16 },
            });

            map.addLayer({
              id: USER_CONE_OUTLINE_ID,
              type: "line",
              source: USER_CONE_SOURCE_ID,
              paint: { "line-color": "#2563eb", "line-width": 1.2, "line-opacity": 0.35 },
            });
          }
        }

        if (startedRef.current && followUserRef.current) {
          const camNow = performance.now();
          if (camNow - lastCameraUpdateRef.current > 260) {
            lastCameraUpdateRef.current = camNow;

            map.easeTo({
              center: [next.lng, next.lat],
              zoom: 17,
              duration: 240,
              bearing: hasSmoothHeadingRef.current ? smoothHeadingRef.current : map.getBearing(),
              pitch: 55,
              essential: true,
            });
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [userLocationRef, userLocation, headingRef, routeActive, activeDestination, routeProfile, onArrive, onProgress, onOffRoute]);

  // ------------------------
  // Route updates:
  // Solid Mapbox route + dotted segments for off-road parts.
  // Dotted shape stays stable because we reuse routeSeedRef.current
  // ------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!routeActive) {
      removeRoute(map);
      routeCoordsRef.current = [];
      routeStepsRef.current = [];
      return;
    }

    const pos = displayPosRef.current || userLocationRef?.current || userLocation;
    if (!pos || !activeDestination) return;

    const now = Date.now();
    if (now - lastRouteUpdateRef.current < 2500) return;
    lastRouteUpdateRef.current = now;

    const from = { lng: pos.lng, lat: pos.lat };
    const to = { lng: activeDestination.lng, lat: activeDestination.lat };

    const seed = routeSeedRef.current;

    const draw = (
      solid?: Array<[number, number]>,
      dottedSegments?: Array<Array<[number, number]>>,
    ) => {
      const fn = () => upsertRouteCollection(map, { solid, dottedSegments });
      if (!map.isStyleLoaded()) map.once("load", fn);
      else fn();
    };

    (async () => {
      // ── Tier 1: Campus graph A* (primary) ───────────────────────────
      const campusResult = buildCampusRouteGeoJSON({
        graph: campusGraph as CampusGraph,
        from,
        to,
        maxSnapMeters: 250,
      });

      if (campusResult) {
        const coords = campusResult.geometry.coordinates as Array<[number, number]>;
        routeCoordsRef.current = coords;
        routeStepsRef.current = buildRouteSteps(coords);
        draw(coords, undefined);
        return;
      }

      // ── Tier 2: Mapbox Directions API (off-campus fallback) ──────────
      try {
        const { coords } = await fetchDirectionsWithSnap({
          from,
          to,
          profile: routeProfile,
        });
        routeCoordsRef.current = coords;
        routeStepsRef.current = buildRouteSteps(coords);
        draw(coords, undefined);
      } catch (e) {
        // ── Tier 3: Straight line last resort ───────────────────────────
        const straightLine: Array<[number, number]> = [
          [from.lng, from.lat],
          [to.lng, to.lat],
        ];
        draw(undefined, [straightLine]);
        console.warn("Route: straight-line fallback used:", e);
      }
    })();
  }, [routeActive, userLocation, activeDestination, routeProfile, userLocationRef]);

  // reset route throttling when toggled / destination changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (routeActive) lastRouteUpdateRef.current = 0;
  }, [routeActive, activeDestination?.id]);

  return (
    <div className="absolute inset-0 gmap">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default MapView;