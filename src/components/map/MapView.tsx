// src/components/map/MapView.tsx
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { renderToStaticMarkup } from "react-dom/server";
import type { Location } from "../../types";

// Import icons
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
  userLocation,
  heading,
}: MapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // ------------------------
  // Initialize Mapbox
  // ------------------------
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [7.526536274555406, 6.468611159365743], // fallback campus center
      zoom: 15,
      minZoom: 14,
      maxZoom: 19,
    });

    // Lock rotation & add navigation controls
    mapRef.current.dragRotate.disable();
    mapRef.current.touchZoomRotate.disableRotation();
    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Lock map to campus bounds
    // mapRef.current.setMaxBounds([
    //   [7.5256750, 6.4667163],
    //   [7.5308232, 6.4719171],
    // ]);

    // Cleanup
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // ------------------------
  // User location marker + camera
  // ------------------------
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    const { lat, lng } = userLocation;

    // Remove old marker
    userMarkerRef.current?.remove();

    // Create marker (triangle with optional heading)
    const el = document.createElement("div");
    el.style.width = "32px";
    el.style.height = "32px";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.background = "none";

    if (typeof heading === "number" && !isNaN(heading)) {
      el.style.transform = `rotate(${heading}deg)`;
    }

    el.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 32 32" style="display:block;">
        <polygon points="16,4 28,28 4,28" fill="#2563eb" stroke="white" stroke-width="2" />
      </svg>
    `;

    userMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .addTo(mapRef.current);

    // Fly to user
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 17,
      speed: 1.4,
      curve: 1.42,
      essential: true,
    });

    return () => {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
    };
  }, [userLocation, heading]);

  console.log("USER LOCATION:", userLocation);

  // ------------------------
  // Render location markers
  // ------------------------
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers
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

      el.innerHTML = renderToStaticMarkup(<Icon size={16} color="white" />);

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


