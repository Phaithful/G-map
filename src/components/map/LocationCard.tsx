import {
  Clock,
  ChevronRight,
  GraduationCap,
  Building2,
  Home,
  Utensils,
  HeartPulse,
  Church,
  Dumbbell,
  ShoppingBag,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Location } from "../../types";

interface LocationCardProps {
  location: Location;
  onClick?: () => void;
  variant?: "compact" | "full";
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

const getCategoryStyles = (category: string) => {
  const styles: Record<string, { bg: string; icon: string; badge: string }> = {
    academics: {
      bg: "bg-blue-100",
      icon: "text-blue-600",
      badge: "bg-blue-100 text-blue-700",
    },
    offices: {
      bg: "bg-slate-100",
      icon: "text-slate-600",
      badge: "bg-slate-100 text-slate-700",
    },
    hostels: {
      bg: "bg-purple-100",
      icon: "text-purple-600",
      badge: "bg-purple-100 text-purple-700",
    },
    food: {
      bg: "bg-orange-100",
      icon: "text-orange-600",
      badge: "bg-orange-100 text-orange-700",
    },
    health: {
      bg: "bg-red-100",
      icon: "text-red-600",
      badge: "bg-red-100 text-red-700",
    },
    churches: {
      bg: "bg-amber-100",
      icon: "text-amber-600",
      badge: "bg-amber-100 text-amber-700",
    },
    sports: {
      bg: "bg-emerald-100",
      icon: "text-emerald-600",
      badge: "bg-emerald-100 text-emerald-700",
    },
    shops: {
      bg: "bg-pink-100",
      icon: "text-pink-600",
      badge: "bg-pink-100 text-pink-700",
    },
  };

  return (
    styles[category] || {
      bg: "bg-primary/10",
      icon: "text-primary",
      badge: "bg-secondary text-secondary-foreground",
    }
  );
};

const LocationCard = ({ location, onClick, variant = "compact" }: LocationCardProps) => {
  const Icon = getCategoryIcon(location.category);
  const styles = getCategoryStyles(location.category);

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="location-card w-full text-left"
    >
      {/* Thumbnail with category icon (slightly smaller) */}
      <div
        className={`w-12 h-12 rounded-xl ${styles.bg} flex items-center justify-center flex-shrink-0`}
      >
        <Icon className={`w-5 h-5 ${styles.icon}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm text-foreground truncate">
            {location.name}
          </h3>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className={`badge ${styles.badge} capitalize text-[11px]`}>
            {location.category}
          </span>
          <span className="text-xs text-muted-foreground">{location.distance}</span>
        </div>

        {variant === "full" && location.openingHours && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{location.openingHours}</span>
          </div>
        )}
      </div>
    </motion.button>
  );
};

export default LocationCard;