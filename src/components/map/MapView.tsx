// src/components/map/MapView.tsx
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { renderToStaticMarkup } from "react-dom/server";
import type { Location } from "../../types";

// Import icons from lucide-react
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
}

// ------------------------
// Icon & Color helpers
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
    academics: "#3b82f6", // blue
    offices: "#64748b", // slate
    hostels: "#8b5cf6", // purple
    food: "#f97316", // orange
    health: "#ef4444", // red
    churches: "#d97706", // amber
    sports: "#10b981", // green
    shops: "#ec4899", // pink
  };
  return colors[category] || "#2563eb";
};

// ------------------------
// MapView component
// ------------------------
const MapView = ({
  locations = [],
  selectedLocation,
  onPinClick,
  userLocation,
}: MapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Initialize Mapbox
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const defaultCenter: [number, number] = [7.3739, 6.8442];

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: defaultCenter,
      zoom: 16,
      pitch: 45,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // User location marker + camera
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    const { lat, lng } = userLocation;

    // Remove old marker
    userMarkerRef.current?.remove();

    // Create new marker element
    const el = document.createElement("div");
    el.style.width = "20px";
    el.style.height = "20px";
    el.style.borderRadius = "50%";
    el.style.background = "#2563eb";
    el.style.border = "3px solid white";
    el.style.boxShadow = "0 0 0 2px rgba(37, 99, 235, 0.3)";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";

    el.innerHTML = `
      <div style="
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: #2563eb;
        animation: pulse 2s infinite;
      "></div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      </style>
    `;

    userMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .addTo(mapRef.current);

    // Fly to user location
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 18,
      duration: 2000,
    });

    // Cleanup
    return () => {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
    };
  }, [userLocation]);

  // Render location markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers
    markersRef.current.forEach((marker) => marker.remove());
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

  return (
    <div className="absolute inset-0">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default MapView;
