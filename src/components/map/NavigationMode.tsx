import { ArrowLeft, Navigation, Clock, MapPin } from "lucide-react";
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
          <motion.button
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            onClick={onClose}
            className="fixed top-3 left-3 z-50 floating-button"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>

          <HamburgerMenu onNavigate={onMenuNavigate} />

          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-3 inset-x-0 z-40 flex justify-center pointer-events-none"
          >
            <div className="nav-pill pointer-events-auto">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-semibold">5 min</span>
              <span className="text-muted-foreground">• 350m</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-2xl shadow-sheet p-3 pb-6"
          >
            <div className="flex items-center gap-3 mb-3 p-3 bg-muted rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{destination.name}</h3>
                <p className="text-xs text-muted-foreground">{destination.distance}</p>
              </div>
            </div>

            <div className="flex items-center justify-around mb-4 py-3 border-y border-border">
              <div className="text-center">
                <p className="text-xl font-bold text-primary">5</p>
                <p className="text-xs text-muted-foreground">min</p>
              </div>
              <div className="w-px h-9 bg-border" />
              <div className="text-center">
                <p className="text-xl font-bold">350</p>
                <p className="text-xs text-muted-foreground">meters</p>
              </div>
              <div className="w-px h-9 bg-border" />
              <div className="text-center">
                <p className="text-xl font-bold">🚶</p>
                <p className="text-xs text-muted-foreground">Walking</p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-border font-semibold hover:bg-muted transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={onStart}
                className="flex-1 cta-button flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
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