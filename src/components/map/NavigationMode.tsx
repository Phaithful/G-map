import { ArrowLeft, Navigation, Clock, MapPin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Location } from "./LocationCard";
import HamburgerMenu from "./HamburgerMenu";

function formatDistance(meters?: number | null) {
  if (!meters && meters !== 0) return "--";
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function formatMinutes(seconds?: number | null) {
  if (!seconds && seconds !== 0) return "--";
  const mins = Math.max(1, Math.round(seconds / 60));
  return `${mins} min`;
}

interface NavigationModeProps {
  isActive: boolean; // preview UI open
  destination: Location | null;

  // NEW
  hasStarted: boolean;
  distanceMeters?: number | null;
  durationSeconds?: number | null;

  onClose: () => void; // back arrow (leave nav UI)
  onStart?: () => void; // start nav (enter started state)
  onExit?: () => void; // stop started nav but keep app usable

  onMenuNavigate?: (page: string) => void;
}

const NavigationMode = ({
  isActive,
  destination,
  hasStarted,
  distanceMeters,
  durationSeconds,
  onClose,
  onStart,
  onExit,
  onMenuNavigate,
}: NavigationModeProps) => {
  if (!isActive || !destination) return null;

  const timeText = formatMinutes(durationSeconds);
  const distText = formatDistance(distanceMeters);

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

          {/* Top pill */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-3 inset-x-0 z-40 flex justify-center pointer-events-none"
          >
            <div className="nav-pill pointer-events-auto">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-semibold">{timeText}</span>
              <span className="text-muted-foreground">• {distText}</span>
            </div>
          </motion.div>

          {/* Bottom sheet */}
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
                <p className="text-xs text-muted-foreground">
                  {timeText} • {distText} • Walking
                </p>
              </div>
            </div>

            {/* BEFORE START */}
            {!hasStarted && (
              <>
                <div className="flex items-center justify-around mb-4 py-3 border-y border-border">
                  <div className="text-center">
                    <p className="text-xl font-bold text-primary">
                      {durationSeconds != null ? Math.max(1, Math.round(durationSeconds / 60)) : "--"}
                    </p>
                    <p className="text-xs text-muted-foreground">min</p>
                  </div>
                  <div className="w-px h-9 bg-border" />
                  <div className="text-center">
                    <p className="text-xl font-bold">
                      {distanceMeters != null ? Math.round(distanceMeters) : "--"}
                    </p>
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
              </>
            )}

            {/* AFTER START (compact) */}
            {hasStarted && (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">
                      {timeText} • {distText}
                    </div>
                    <div className="text-xs text-muted-foreground">Walking to destination</div>
                  </div>
                </div>

                <button
                  onClick={onExit}
                  className="px-4 py-3 rounded-xl border border-border font-semibold hover:bg-muted transition-colors text-sm flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Exit
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NavigationMode;