import { useState, useEffect, ReactNode } from "react";
import { motion, PanInfo } from "framer-motion";

interface BottomSheetProps {
  children: ReactNode;
  expandedContent?: ReactNode;
  expandedHeader?: ReactNode;
  isExpanded?: boolean;
}

const BottomSheet = ({
  children,
  expandedContent,
  expandedHeader,
  isExpanded = false,
}: BottomSheetProps) => {
  const [snapIndex, setSnapIndex] = useState(0);

  /**
   * snapIndex 0 = collapsed (FIT content)
   * snapIndex 1 = mid
   * snapIndex 2 = full
   */
  const snapPoints = [0.6, 0.82];

  useEffect(() => {
    if (isExpanded) setSnapIndex(0); // when expanded externally, open to mid (index 0 of snapPoints)
    else setSnapIndex(0);
  }, [isExpanded]);

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const velocity = info.velocity.y;

    // If currently collapsed, dragging up should expand to mid
    if (snapIndex === -1) {
      if (velocity < -200 || info.offset.y < -40) setSnapIndex(0);
      return;
    }

    if (velocity < -300) {
      setSnapIndex(Math.min(snapIndex + 1, snapPoints.length - 1));
    } else if (velocity > 300) {
      // if dragging down from mid, go to collapsed-fit
      if (snapIndex === 0) setSnapIndex(-1);
      else setSnapIndex(Math.max(snapIndex - 1, 0));
    } else {
      const offset = info.offset.y;

      // small threshold snapping
      if (offset < -40 && snapIndex < snapPoints.length - 1) {
        setSnapIndex(snapIndex + 1);
      } else if (offset > 40) {
        if (snapIndex === 0) setSnapIndex(-1);
        else setSnapIndex(snapIndex - 1);
      }
    }
  };

  const isSheetExpanded = snapIndex >= 0; // expanded modes are 0..n, collapsed-fit is -1

  // Collapsed height: just enough for categories (+ padding + handle)
  // Expanded heights: use vh snap points
  const heightStyle =
    snapIndex === -1 ? "auto" : `${snapPoints[snapIndex] * 100}vh`;

  return (
    <motion.div
      className="fixed left-0 right-0 bottom-0 z-40 bottom-sheet touch-none"
      style={{ height: heightStyle }}
      animate={{ height: heightStyle }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
    >
      <div className="sheet-handle cursor-grab active:cursor-grabbing" />

      {/* When collapsed (fit), we don't force scroll / large maxHeight */}
      <div
        className="px-3 pb-4"
        style={
          snapIndex === -1
            ? undefined
            : { maxHeight: `calc(${snapPoints[snapIndex] * 100}vh - 2rem)` }
        }
      >
        {children}

        {/* Share button removed بالكامل ✅ */}

        {isSheetExpanded && (expandedHeader || expandedContent) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-4 flex flex-col"
            style={{
              maxHeight: `calc(${snapPoints[Math.max(snapIndex, 0)] * 100}vh - 7rem)`,
            }}
          >
            {expandedHeader && (
              <div className="flex-shrink-0 pb-3">{expandedHeader}</div>
            )}

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