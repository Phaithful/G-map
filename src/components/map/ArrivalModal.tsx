import { motion, AnimatePresence } from "framer-motion";
import { MapPinCheck, Sparkles, RotateCcw } from "lucide-react";
import type { Location } from "../../types";

interface ArrivalModalProps {
  location: Location | null;
  isOpen: boolean;
  onDismiss: () => void;
  onNewSearch: () => void;
}

const ArrivalModal = ({ location, isOpen, onDismiss, onNewSearch }: ArrivalModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && location && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-[60] bg-card rounded-t-2xl shadow-sheet p-4 pb-8"
        >
          <div className="w-8 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />

          <div className="flex flex-col items-center gap-4 pt-2">
            <div className="flex flex-col items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPinCheck className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">You've arrived!</h2>
              <p className="text-sm font-medium text-primary mt-0.5">{location.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Great job navigating. You've reached your destination.
              </p>
            </div>

            <div className="flex gap-2.5 w-full mt-2">
              <button
                onClick={onDismiss}
                className="flex-1 py-3 rounded-xl border border-border font-semibold hover:bg-muted transition-colors text-sm"
              >
                Done
              </button>
              <button
                onClick={onNewSearch}
                className="flex-1 cta-button flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                New Search
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ArrivalModal;
