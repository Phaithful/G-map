// src/components/map/MapView.tsx
import { useEffect, useRef } from "react";
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

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

interface MapViewProps {
  locations?: Location[];
  selectedLocation?: Location | null;
  onPinClick?: (location: Location) => void;

  userLocation?: { lat: number; lng: number } | null;
  userLocationRef?: React.MutableRefObject<{ lat: number; lng: number } | null>;

  headingRef?: React.MutableRefObject<number | null>;

  /** show route as soon as "Get Directions" opens */
  routeActive?: boolean;

  /**
   * ✅ Start mode: hide every POI marker except destination.
   * Markers MUST stay hidden until Exit.
   */
  hideOtherPins?: boolean;

  activeDestination?: Location | null;
  routeProfile?: "walking" | "driving" | "cycling";
}

// ------------------------
// Helpers (Pins)
// ------------------------
const getCategoryIcon = (category: string) => {
  const icons: Record<string, typeof GraduationCap> = {
    academics: GraduationCap,
    offices: Building2,
    hostels: Home,
    food: Utensils,
    health: HeartPulse,
    churches: Church,
    sports: Dumbbell,
    shops: ShoppingBag,
  };
  return icons[category] || GraduationCap;
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    academics: "#3b82f6",
    offices: "#64748b",
    hostels: "#8b5cf6",
    food: "#f97316",
    health: "#ef4444",
    churches: "#d97706",
    sports: "#10b981",
    shops: "#ec4899",
  };
  return colors[category] || "#2563eb";
};

// ------------------------
// Helpers (Routing)
// ------------------------
const ROUTE_SOURCE_ID = "gmap-route-source";
const ROUTE_LAYER_ID = "gmap-route-layer";

async function fetchRoute(args: {
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

  const route = data?.routes?.[0]?.geometry;
  if (!route) throw new Error("No route found");
  return route;
}

function upsertRouteLayer(map: mapboxgl.Map, routeGeometry: any) {
  const feature = {
    type: "Feature",
    properties: {},
    geometry: routeGeometry,
  } as const;

  const existing = map.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
  if (existing) {
    existing.setData(feature as any);
    return;
  }

  map.addSource(ROUTE_SOURCE_ID, { type: "geojson", data: feature as any });

  map.addLayer({
    id: ROUTE_LAYER_ID,
    type: "line",
    source: ROUTE_SOURCE_ID,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-width": 5,
      "line-opacity": 0.95,
      "line-color": "#2563eb",
    },
  });
}

function removeRouteLayer(map: mapboxgl.Map) {
  if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
  if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);
}

// ------------------------
// Helpers (Geo / Cone)
// ------------------------
const USER_CONE_SOURCE_ID = "gmap-user-cone-source";
const USER_CONE_LAYER_ID = "gmap-user-cone-layer";
const USER_CONE_OUTLINE_ID = "gmap-user-cone-outline-layer";

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
// Campus bounds
// ------------------------
const CAMPUS_BOUNDS_EXPANDED: [[number, number], [number, number]] = [
  [7.5243190, 6.4653693],
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

  // ✅ allow user to pan/zoom/rotate freely during routing
  const followUserRef = useRef<boolean>(true);

  // ✅ follow ONLY after Start (hideOtherPins === true)
  const startedRef = useRef<boolean>(false);
  useEffect(() => {
    startedRef.current = hideOtherPins;
    if (hideOtherPins) followUserRef.current = true;
  }, [hideOtherPins]);

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

    // ✅ rotation enabled
    map.touchZoomRotate.enable();
    map.dragRotate.enable();

    // stop snapping back when user interacts (drag/zoom/rotate/pitch)
    const stopFollowing = () => {
      followUserRef.current = false;
    };
    map.on("dragstart", stopFollowing);
    map.on("zoomstart", stopFollowing);
    map.on("rotatestart", stopFollowing);
    map.on("pitchstart", stopFollowing);

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
    map.on("load", () => geolocate.trigger());

    geolocate.on("geolocate", (e) => {
      const { latitude, longitude } = e.coords;

      const insideCampus =
        longitude >= 7.5256750 &&
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

      document.querySelector('style[data-gmap="hide-mapbox-user-dot"]')?.remove();

      map.off("dragstart", stopFollowing);
      map.off("zoomstart", stopFollowing);
      map.off("rotatestart", stopFollowing);
      map.off("pitchstart", stopFollowing);

      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ------------------------
  // ✅ Render POI markers
  // IMPORTANT FIX:
  // When hideOtherPins is true (Start mode), we ONLY create destination marker.
  // That prevents the "blink" caused by re-creating markers then hiding them.
  // ------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    Object.values(markersByIdRef.current).forEach((m) => m.remove());
    markersByIdRef.current = {};

    const destId = activeDestination?.id ? String(activeDestination.id) : null;

    // Decide which locations to actually render
    const renderList: Location[] = hideOtherPins
      ? destId
        ? locations.filter((l) => String(l.id) === destId)
        : [] // no destination? render none
      : locations;

    renderList.forEach((location) => {
      const el = document.createElement("div");
      const Icon = getCategoryIcon(location.category);
      const color = getCategoryColor(location.category);

      el.style.width = "32px";
      el.style.height = "32px";
      el.style.borderRadius = "50%";
      el.style.background = color;
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.border = "2px solid white";
      el.style.cursor = "pointer";
      el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.22)";

      el.innerHTML = renderToStaticMarkup(<Icon size={16} color="white" />);
      el.onclick = () => onPinClick?.(location);

      const marker = new mapboxgl.Marker(el).setLngLat([location.lng, location.lat]).addTo(map);
      markersByIdRef.current[String(location.id)] = marker;
    });
  }, [locations, onPinClick, hideOtherPins, activeDestination]);

  // RAF loop: puck + cone + optional follow
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

        // cone updates
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

        // follow only after Start, only if user hasn't interacted
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
  }, [userLocationRef, userLocation, headingRef]);

  // Route updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!routeActive) {
      removeRouteLayer(map);
      return;
    }

    const pos = displayPosRef.current || userLocationRef?.current || userLocation;
    if (!pos || !activeDestination) return;

    const now = Date.now();
    if (now - lastRouteUpdateRef.current < 2500) return;
    lastRouteUpdateRef.current = now;

    fetchRoute({
      from: { lng: pos.lng, lat: pos.lat },
      to: { lng: activeDestination.lng, lat: activeDestination.lat },
      profile: routeProfile,
    })
      .then((route) => {
        if (!map.isStyleLoaded()) {
          map.once("load", () => upsertRouteLayer(map, route));
          return;
        }
        upsertRouteLayer(map, route);
      })
      .catch((err) => console.warn("Route error:", err));
  }, [routeActive, userLocation, activeDestination, routeProfile, userLocationRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (routeActive) lastRouteUpdateRef.current = 0;
    else removeRouteLayer(map);
  }, [routeActive, activeDestination?.id]);

  return (
    <div className="absolute inset-0 gmap">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default MapView;