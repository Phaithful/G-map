import { useEffect, useRef, useState } from "react";
import { 
  Navigation, 
  GraduationCap, 
  Building2, 
  Home, 
  Utensils, 
  HeartPulse, 
  Church, 
  Dumbbell, 
  ShoppingBag 
} from "lucide-react";

interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
}

interface MapViewProps {
  locations?: Location[];
  selectedLocation?: Location | null;
  onPinClick?: (location: Location) => void;
  userLocation?: { lat: number; lng: number } | null;
  route?: { start: Location; end: Location } | null;
}

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
    academics: "bg-blue-500",
    offices: "bg-slate-500",
    hostels: "bg-purple-500",
    food: "bg-orange-500",
    health: "bg-red-500",
    churches: "bg-amber-600",
    sports: "bg-emerald-500",
    shops: "bg-pink-500",
  };
  return colors[category] || "bg-primary";
};

const MapView = ({ 
  locations = [], 
  selectedLocation, 
  onPinClick,
  userLocation,
  route 
}: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      ref={mapRef}
      className="absolute inset-0 bg-[#f5f3ef]"
    >
      {/* Street grid pattern - like Google Maps */}
      <svg className="absolute inset-0 w-full h-full">
        {/* Main roads */}
        <path d="M 0 120 L 400 120" stroke="#e0ddd8" strokeWidth="20" fill="none" />
        <path d="M 0 280 L 400 280" stroke="#e0ddd8" strokeWidth="20" fill="none" />
        <path d="M 0 440 L 400 440" stroke="#e0ddd8" strokeWidth="16" fill="none" />
        <path d="M 0 580 L 400 580" stroke="#e0ddd8" strokeWidth="14" fill="none" />
        
        {/* Vertical roads */}
        <path d="M 80 0 L 80 700" stroke="#e0ddd8" strokeWidth="16" fill="none" />
        <path d="M 200 0 L 200 700" stroke="#e0ddd8" strokeWidth="20" fill="none" />
        <path d="M 320 0 L 320 700" stroke="#e0ddd8" strokeWidth="14" fill="none" />
        
        {/* Road center lines */}
        <path d="M 0 120 L 400 120" stroke="#fff" strokeWidth="2" strokeDasharray="8 8" fill="none" />
        <path d="M 0 280 L 400 280" stroke="#fff" strokeWidth="2" strokeDasharray="8 8" fill="none" />
        <path d="M 200 0 L 200 700" stroke="#fff" strokeWidth="2" strokeDasharray="8 8" fill="none" />
        
        {/* Street labels */}
        <text x="30" y="115" className="text-[8px] fill-muted-foreground/60" fontFamily="system-ui">Main St</text>
        <text x="30" y="275" className="text-[8px] fill-muted-foreground/60" fontFamily="system-ui">College Rd</text>
        <text x="30" y="435" className="text-[8px] fill-muted-foreground/60" fontFamily="system-ui">Park Ave</text>
        <text x="205" y="50" className="text-[8px] fill-muted-foreground/60" fontFamily="system-ui" transform="rotate(90, 205, 50)">Campus Dr</text>
      </svg>

      {/* Building blocks */}
      <div className="absolute top-[8%] left-[25%] w-20 h-14 bg-[#e8e5e0] rounded-sm shadow-sm" />
      <div className="absolute top-[8%] right-[15%] w-16 h-12 bg-[#e8e5e0] rounded-sm shadow-sm" />
      <div className="absolute top-[22%] left-[8%] w-14 h-16 bg-[#e8e5e0] rounded-sm shadow-sm" />
      <div className="absolute top-[22%] left-[55%] w-24 h-10 bg-[#e8e5e0] rounded-sm shadow-sm" />
      <div className="absolute top-[38%] left-[25%] w-18 h-14 bg-[#e8e5e0] rounded-sm shadow-sm" />
      <div className="absolute top-[38%] right-[20%] w-20 h-16 bg-[#e8e5e0] rounded-sm shadow-sm" />
      <div className="absolute top-[52%] left-[10%] w-16 h-12 bg-[#e8e5e0] rounded-sm shadow-sm" />
      <div className="absolute top-[52%] left-[50%] w-14 h-14 bg-[#e8e5e0] rounded-sm shadow-sm" />
      <div className="absolute top-[65%] left-[30%] w-20 h-10 bg-[#e8e5e0] rounded-sm shadow-sm" />
      <div className="absolute top-[65%] right-[15%] w-16 h-14 bg-[#e8e5e0] rounded-sm shadow-sm" />

      {/* Green spaces */}
      <div className="absolute top-[15%] right-[35%] w-12 h-12 bg-green-200/60 rounded-full" />
      <div className="absolute top-[48%] left-[35%] w-16 h-10 bg-green-200/60 rounded-lg" />
      <div className="absolute top-[72%] left-[12%] w-10 h-10 bg-green-200/60 rounded-full" />

      {/* Route line if navigating */}
      {route && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <path
            d="M 180 520 C 180 400, 220 350, 220 280 C 220 220, 280 180, 280 120"
            stroke="hsl(var(--primary))"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* Location pins with category icons */}
      {locations.map((location, index) => {
        const Icon = getCategoryIcon(location.category);
        const bgColor = getCategoryColor(location.category);
        const isSelected = selectedLocation?.id === location.id;
        
        return (
          <button
            key={location.id}
            onClick={() => onPinClick?.(location)}
            className={`absolute transform -translate-x-1/2 -translate-y-full transition-all duration-200 ${
              isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10'
            }`}
            style={{
              top: `${15 + (index * 12) % 55}%`,
              left: `${12 + (index * 18) % 75}%`,
            }}
          >
            <div className="relative">
              {isSelected && (
                <div className="absolute -inset-2 rounded-full bg-primary/20 animate-pulse" />
              )}
              {/* Pin shape */}
              <div className={`relative ${bgColor} rounded-full p-2 shadow-lg border-2 border-white`}>
                <Icon className="w-4 h-4 text-white" />
                {/* Pin pointer */}
                <div 
                  className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent`}
                  style={{ borderTopColor: 'inherit' }}
                />
              </div>
              <div 
                className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent ${bgColor.replace('bg-', 'border-t-')}`}
              />
            </div>
          </button>
        );
      })}

      {/* User location indicator */}
      {userLocation && (
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30"
          style={{ top: '75%', left: '45%' }}
        >
          <div className="relative">
            <div className="absolute inset-0 w-8 h-8 rounded-full bg-primary/30 animate-ping" />
            <div className="w-8 h-8 rounded-full bg-primary border-4 border-white shadow-lg flex items-center justify-center">
              <Navigation className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
};

export default MapView;
