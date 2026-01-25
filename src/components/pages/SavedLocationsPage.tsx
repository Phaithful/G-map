import { ArrowLeft, Heart, MapPin, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Location } from "../map/LocationCard";

interface SavedLocationsPageProps {
  onBack: () => void;
  savedLocations: Location[];
  onRemove?: (id: string) => void;
  onSelect?: (location: Location) => void;
}

const SavedLocationsPage = ({ 
  onBack, 
  savedLocations, 
  onRemove,
  onSelect 
}: SavedLocationsPageProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button
          onClick={onBack}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Saved Locations</h1>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto" style={{ height: 'calc(100vh - 64px)' }}>
        {savedLocations.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <Heart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No saved places yet</h2>
            <p className="text-muted-foreground max-w-xs">
              Start exploring the campus and save your favorite locations for quick access.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {savedLocations.map((location, index) => (
                <motion.div
                  key={location.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="location-card group"
                >
                  <button
                    onClick={() => onSelect?.(location)}
                    className="flex-1 flex items-center gap-4"
                  >
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">{location.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{location.category}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => onRemove?.(location.id)}
                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded-full transition-all"
                  >
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SavedLocationsPage;
