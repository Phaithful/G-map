// src/components/map/MapView.tsx
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { renderToStaticMarkup } from "react-dom/server";
import type { Location } from "../../types";

// Icons
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
  userLocation?: {
    lat: number;
    lng: number;
  } | null;
  heading?: number | null;
}

// ------------------------
// Helpers
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
// MapView Component
// ------------------------
const MapView = ({
  locations = [],
  selectedLocation,
  onPinClick,
}: MapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // ------------------------
  // Initialize Mapbox
  // ------------------------
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",

      // Fallback view (campus center)
      center: [7.526536274555406, 6.468611159365743], // Godfrey Okoye University
      zoom: 15,
      minZoom: 14,
      maxZoom: 19,
    });

    // UX polish
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
   

    map.on("load", () => {
      geolocate.trigger(); // 👈 THIS is what you were missing
    });

    // ------------------------
    // STANDARD GEOLOCATE CONTROL
    // ------------------------
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,   // live updates
      showUserHeading: true,     // arrow direction
      showAccuracyCircle: true,  // GPS uncertainty
      fitBoundsOptions: {
        maxZoom: 18,
      },
    });

    map.addControl(geolocate, "top-right");

    // Apply campus bounds AFTER valid location is received
    geolocate.on("geolocate", (e) => {
      const { latitude, longitude } = e.coords;

      const insideCampus =
        longitude >= 7.5256750 &&
        longitude <= 7.5308232 &&
        latitude >= 6.4667163 &&
        latitude <= 6.4719171;

      if (insideCampus) {
        map.setMaxBounds([
          [7.5256750, 6.4667163],
          [7.5308232, 6.4719171],
        ]);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ------------------------
  // Render POI Markers
  // ------------------------
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    locations.forEach((location) => {
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
      el.style.boxShadow = "0 4px 10px rgba(0,0,0,0.3)";

      el.innerHTML = renderToStaticMarkup(
        <Icon size={16} color="white" />
      );

      el.onclick = () => onPinClick?.(location);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([location.lng, location.lat])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [locations, selectedLocation]);

  // ------------------------
  // Render
  // ------------------------
  return (
    <div className="absolute inset-0">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default MapView;
