import { useState, useEffect, ReactNode } from "react";
import { motion, PanInfo } from "framer-motion";
import { Share2 } from "lucide-react";

interface BottomSheetProps {
  children: ReactNode;
  expandedContent?: ReactNode;
  expandedHeader?: ReactNode;
  onShareLocation?: () => void;
  isExpanded?: boolean;
}

const BottomSheet = ({
  children,
  expandedContent,
  expandedHeader,
  onShareLocation,
  isExpanded = false,
}: BottomSheetProps) => {
  const [snapIndex, setSnapIndex] = useState(0);

  // slightly smaller feel
  const snapPoints = [0.32, 0.6, 0.82];

  useEffect(() => {
    if (isExpanded) setSnapIndex(1);
    else setSnapIndex(0);
  }, [isExpanded]);

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const velocity = info.velocity.y;

    if (velocity < -300) {
      setSnapIndex(Math.min(snapIndex + 1, snapPoints.length - 1));
    } else if (velocity > 300) {
      setSnapIndex(Math.max(snapIndex - 1, 0));
    } else {
      const offset = info.offset.y;
      const screenHeight = window.innerHeight;
      const dragPercentage = offset / screenHeight;

      if (dragPercentage < -0.1 && snapIndex < snapPoints.length - 1) {
        setSnapIndex(snapIndex + 1);
      } else if (dragPercentage > 0.1 && snapIndex > 0) {
        setSnapIndex(snapIndex - 1);
      }
    }
  };

  const currentHeight = snapPoints[snapIndex];
  const isSheetExpanded = snapIndex >= 1;

  return (
    <motion.div
      className="fixed left-0 right-0 bottom-0 z-40 bottom-sheet touch-none"
      style={{ height: `${currentHeight * 100}vh` }}
      animate={{ height: `${currentHeight * 100}vh` }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
    >
      <div className="sheet-handle cursor-grab active:cursor-grabbing" />

      <div
        className="px-3 pb-6 overflow-y-auto no-scrollbar"
        style={{ maxHeight: `calc(${currentHeight * 100}vh - 2rem)` }}
      >
        {children}

        {!isSheetExpanded && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={onShareLocation}
            className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] text-sm"
          >
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <span>Share My Location</span>
          </motion.button>
        )}

        {isSheetExpanded && (expandedHeader || expandedContent) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-4 flex flex-col h-full"
            style={{ maxHeight: `calc(${currentHeight * 100}vh - 7rem)` }}
          >
            {expandedHeader && <div className="flex-shrink-0 pb-3">{expandedHeader}</div>}

            {expandedContent && (
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5">
                {expandedContent}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default BottomSheet;