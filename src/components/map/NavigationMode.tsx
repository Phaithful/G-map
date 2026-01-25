import { ArrowLeft, Navigation, Clock, MapPin, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Location } from "./LocationCard";
import HamburgerMenu from "./HamburgerMenu";

interface NavigationModeProps {
  isActive: boolean;
  destination: Location | null;
  onClose: () => void;
  onStart?: () => void;
  onMenuNavigate?: (page: string) => void;
}

const NavigationMode = ({ isActive, destination, onClose, onStart, onMenuNavigate }: NavigationModeProps) => {
  if (!isActive || !destination) return null;

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Back button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={onClose}
            className="fixed top-4 left-4 z-50 floating-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          {/* Hamburger menu */}
          <HamburgerMenu onNavigate={onMenuNavigate} />

          {/* Top ETA pill - Centered */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 inset-x-0 z-40 flex justify-center pointer-events-none"
          >
            <div className="nav-pill pointer-events-auto">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-semibold">5 min</span>
              <span className="text-muted-foreground">• 350m</span>
            </div>
          </motion.div>

          {/* Bottom navigation sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl shadow-sheet p-4 pb-8"
          >
            {/* Destination info */}
            <div className="flex items-center gap-4 mb-4 p-3 bg-muted rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{destination.name}</h3>
                <p className="text-sm text-muted-foreground">{destination.distance}</p>
              </div>
            </div>

            {/* Route info */}
            <div className="flex items-center justify-around mb-6 py-4 border-y border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">5</p>
                <p className="text-sm text-muted-foreground">min</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold">350</p>
                <p className="text-sm text-muted-foreground">meters</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold">🚶</p>
                <p className="text-sm text-muted-foreground">Walking</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl border border-border font-semibold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={onStart}
                className="flex-1 cta-button flex items-center justify-center gap-2"
              >
                <Navigation className="w-5 h-5" />
                Start
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NavigationMode;
