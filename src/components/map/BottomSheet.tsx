import { useState, ReactNode } from "react";
import { motion, PanInfo } from "framer-motion";
import { Share2 } from "lucide-react";

interface BottomSheetProps {
  children: ReactNode;
  expandedContent?: ReactNode;
  onShareLocation?: () => void;
}

const BottomSheet = ({
  children,
  expandedContent,
  onShareLocation,
}: BottomSheetProps) => {
  const [snapIndex, setSnapIndex] = useState(0);
  const snapPoints = [0.35, 0.65, 0.85]; // Percentage of screen height from bottom

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocity = info.velocity.y;
    
    if (velocity < -300) {
      // Swiping up fast
      setSnapIndex(Math.min(snapIndex + 1, snapPoints.length - 1));
    } else if (velocity > 300) {
      // Swiping down fast
      setSnapIndex(Math.max(snapIndex - 1, 0));
    } else {
      // Snap to nearest
      const currentHeight = snapPoints[snapIndex];
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
  const isExpanded = snapIndex >= 1;

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
      {/* Handle */}
      <div className="sheet-handle cursor-grab active:cursor-grabbing" />
      
      {/* Content */}
      <div 
        className="px-4 pb-8 overflow-y-auto no-scrollbar"
        style={{ maxHeight: `calc(${currentHeight * 100}vh - 2rem)` }}
      >
        {children}
        
        {/* Share Location Button - Only visible when collapsed */}
        {!isExpanded && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={onShareLocation}
            className="w-full mt-4 py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <span>Share My Location</span>
          </motion.button>
        )}
        
        {isExpanded && expandedContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6"
          >
            {expandedContent}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default BottomSheet;
