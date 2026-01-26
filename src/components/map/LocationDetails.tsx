import { ArrowLeft, Navigation, Heart, Share2, Clock, MapPin, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Location } from "./LocationCard";
import OptimizedImage from "../ui/OptimizedImage";
import { locationImages, categoryFallbacks } from "../../data/locationImages";

interface LocationDetailsProps {
  location: Location | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  isSaved?: boolean;
}

// Image handling is now done through OptimizedImage component and locationImages data

const LocationDetails = ({ 
  location, 
  isOpen, 
  onClose, 
  onNavigate,
  onSave,
  onShare,
  isSaved = false
}: LocationDetailsProps) => {
  if (!location) return null;

  // Get image URL - specific location image or category fallback
  const getImageUrl = () => {
    return locationImages[location.id] || categoryFallbacks[location.category] || "/images/default-location.jpg";
  };

  const imageUrl = getImageUrl();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl shadow-sheet max-h-[85vh] overflow-hidden"
        >
          {/* Image header */}
          <div className="relative h-48 overflow-hidden">
            <OptimizedImage
              src={imageUrl}
              alt={location.name}
              className="w-full h-full object-cover"
              category={location.category}
              priority={true}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-4 left-4 floating-button"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 floating-button"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Location icon overlay */}
            <div className="absolute bottom-4 left-4">
              <div className="w-16 h-16 rounded-2xl bg-card shadow-lg flex items-center justify-center">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 pb-8 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 12rem)' }}>
            {/* Title and badge */}
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-foreground">{location.name}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="badge bg-primary/10 text-primary capitalize">{location.category}</span>
                <span className="text-muted-foreground">{location.distance}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mb-6">
              <button onClick={onNavigate} className="cta-button flex items-center justify-center gap-2">
                <Navigation className="w-5 h-5" />
                Get Directions
              </button>
              <button 
                onClick={onSave} 
                className={`icon-button transition-all duration-200 ${isSaved ? 'bg-primary text-primary-foreground' : ''}`}
              >
                <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
              <button onClick={onShare} className="icon-button">
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Details */}
            <div className="space-y-4">
              {/* Opening hours */}
              <div className="flex items-start gap-3 p-4 bg-muted rounded-2xl">
                <Clock className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">Opening Hours</h4>
                  <p className="text-sm text-muted-foreground">
                    {location.openingHours || "Mon - Fri: 8:00 AM - 6:00 PM"}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium mb-2">About</h4>
                <p className="text-muted-foreground leading-relaxed">
                  {location.description || 
                    "This is a key location on campus. Visit during opening hours for assistance and services. Accessible via the main campus path."}
                </p>
              </div>

              {/* Report issue */}
              <button className="w-full flex items-center justify-center gap-2 p-4 border border-border rounded-2xl text-muted-foreground hover:bg-muted transition-colors">
                <AlertCircle className="w-5 h-5" />
                Report an issue
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LocationDetails;
