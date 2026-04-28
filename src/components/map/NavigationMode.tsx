import {
  ArrowLeft,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  Navigation,
  Clock,
  MapPin,
  MapPinCheck,
  RotateCcw,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Location } from "./LocationCard";
import HamburgerMenu from "./HamburgerMenu";
import type { RouteStep, TurnType } from "../../lib/campusRouting";

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

function TurnIcon({ turn, className }: { turn: TurnType; className?: string }) {
  const props = { className: className ?? "w-7 h-7 text-primary" };
  switch (turn) {
    case "left":
    case "slight-left":  return <ArrowUpLeft {...props} />;
    case "right":
    case "slight-right": return <ArrowUpRight {...props} />;
    case "arrive":       return <MapPinCheck {...props} />;
    default:             return <ArrowUp {...props} />;
  }
}

interface NavigationModeProps {
  isActive: boolean;
  destination: Location | null;
  hasStarted: boolean;
  distanceMeters?: number | null;
  durationSeconds?: number | null;
  onClose: () => void;
  onStart?: () => void;
  onExit?: () => void;
  onMenuNavigate?: (page: string) => void;
  // live navigation props
  steps?: RouteStep[];
  currentStepIndex?: number;
  remainingDistanceM?: number | null;
  isRerouting?: boolean;
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
  steps = [],
  currentStepIndex = 0,
  remainingDistanceM,
  isRerouting = false,
}: NavigationModeProps) => {
  if (!isActive || !destination) return null;

  const liveDistM = remainingDistanceM ?? distanceMeters;
  const liveDistS = liveDistM != null ? liveDistM / 1.35 : durationSeconds;
  const timeText = formatMinutes(liveDistS);
  const distText = formatDistance(liveDistM);

  const currentStep = steps[currentStepIndex];
  const nextStep = steps[currentStepIndex + 1];

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

          {/* Top pill — shows live ETA or "Recalculating…" */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-3 inset-x-0 z-40 flex justify-center pointer-events-none"
          >
            <div className="nav-pill pointer-events-auto">
              {isRerouting ? (
                <>
                  <RotateCcw className="w-4 h-4 text-primary animate-spin" />
                  <span className="font-semibold">Recalculating…</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-semibold">{timeText}</span>
                  <span className="text-muted-foreground">• {distText}</span>
                </>
              )}
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
            {/* Destination row */}
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

            {/* AFTER START — instruction card + stats row */}
            {hasStarted && (
              <div className="flex flex-col gap-2.5">
                {/* Current step instruction */}
                {currentStep && (
                  <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <TurnIcon turn={currentStep.turn} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight">{currentStep.instruction}</p>
                      {nextStep && nextStep.turn !== "arrive" && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Then: {nextStep.instruction}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats + exit row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{timeText} • {distText}</div>
                      <div className="text-xs text-muted-foreground">
                        {currentStep?.turn === "arrive" ? "Arriving…" : "Walking to destination"}
                      </div>
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
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NavigationMode;
