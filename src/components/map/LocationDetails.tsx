import { ArrowLeft, Navigation, Heart, Share2, Clock, MapPin, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Location } from "../../types";
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

const LocationDetails = ({
  location,
  isOpen,
  onClose,
  onNavigate,
  onSave,
  onShare,
  isSaved = false,
}: LocationDetailsProps) => {
  if (!location) return null;

  const getImageUrl = () => {
    return (
      locationImages[location.id] ||
      categoryFallbacks[location.category] ||
      "/images/default-location.jpg"
    );
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
          className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-2xl shadow-sheet max-h-[82vh] overflow-hidden"
        >
          <div className="relative h-40 overflow-hidden">
            <OptimizedImage
              src={imageUrl}
              alt={location.name}
              className="w-full h-full object-cover"
              category={location.category}
              priority={true}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

            <button onClick={onClose} className="absolute top-3 left-3 floating-button">
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button onClick={onClose} className="absolute top-3 right-3 floating-button">
              <X className="w-4 h-4" />
            </button>

            <div className="absolute bottom-3 left-3">
              <div className="w-12 h-12 rounded-xl bg-card shadow-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="p-3 pb-6 overflow-y-auto" style={{ maxHeight: "calc(82vh - 10rem)" }}>
            <div className="mb-3">
              <h2 className="text-xl font-bold text-foreground">{location.name}</h2>
              <div className="flex items-center gap-2.5 mt-2">
                <span className="badge bg-primary/10 text-primary capitalize">{location.category}</span>
                <span className="text-xs text-muted-foreground">{location.distance}</span>
              </div>
            </div>

            <div className="flex gap-2.5 mb-4">
              <button onClick={onNavigate} className="cta-button flex items-center justify-center gap-2">
                <Navigation className="w-4 h-4" />
                Get Directions
              </button>

              <button
                onClick={onSave}
                className={`icon-button transition-all duration-200 ${isSaved ? "bg-primary text-primary-foreground" : ""}`}
                aria-label="Save"
              >
                <Heart className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
              </button>

              <button onClick={onShare} className="icon-button" aria-label="Share">
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5 p-3 bg-muted rounded-xl">
                <Clock className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Opening Hours</h4>
                  <p className="text-xs text-muted-foreground">
                    {location.openingHours || "Mon - Fri: 8:00 AM - 6:00 PM"}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-1.5">About</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {location.description ||
                    "This is a key location on campus. Visit during opening hours for assistance and services. Accessible via the main campus path."}
                </p>
              </div>

              <button className="w-full flex items-center justify-center gap-2 p-3 border border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors text-sm">
                <AlertCircle className="w-4 h-4" />
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