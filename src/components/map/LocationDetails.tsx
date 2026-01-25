import { ArrowLeft, Navigation, Heart, Share2, Clock, MapPin, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Location } from "./LocationCard";

interface LocationDetailsProps {
  location: Location | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  isSaved?: boolean;
}

// Placeholder images for different categories
const categoryImages: Record<string, string> = {
  library: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&h=400&fit=crop",
  lecture: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=400&fit=crop",
  cafeteria: "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800&h=400&fit=crop",
  hostel: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=400&fit=crop",
  office: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop",
  sports: "https://images.unsplash.com/photo-1461896836934- voices08a289a?w=800&h=400&fit=crop",
  parking: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&h=400&fit=crop",
  shop: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop",
};

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

  const imageUrl = categoryImages[location.category] || categoryImages.office;

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
            <img 
              src={imageUrl} 
              alt={location.name}
              className="w-full h-full object-cover"
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
