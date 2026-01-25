import { motion } from "framer-motion";
import { MapPin, WifiOff, Search } from "lucide-react";

interface LoadingStateProps {
  type: "loading" | "no-results" | "network-error" | "not-found";
  message?: string;
  onRetry?: () => void;
}

const LoadingStates = ({ type, message, onRetry }: LoadingStateProps) => {
  const states = {
    loading: {
      icon: null,
      title: "Loading...",
      description: "Finding the best locations for you",
      showRetry: false,
    },
    "no-results": {
      icon: <Search className="w-12 h-12" />,
      title: "No results found",
      description: message || "Try searching for something else",
      showRetry: false,
    },
    "network-error": {
      icon: <WifiOff className="w-12 h-12" />,
      title: "Connection lost",
      description: "Please check your internet connection",
      showRetry: true,
    },
    "not-found": {
      icon: <MapPin className="w-12 h-12" />,
      title: "Location not found",
      description: message || "This location doesn't exist or has been removed",
      showRetry: false,
    },
  };

  const state = states[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-8 text-center"
    >
      {type === "loading" ? (
        /* Loading shimmer */
        <div className="space-y-4 w-full max-w-sm">
          <div className="shimmer h-20 rounded-2xl" />
          <div className="shimmer h-20 rounded-2xl" />
          <div className="shimmer h-20 rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
            {state.icon}
          </div>
          <h2 className="text-xl font-semibold mb-2">{state.title}</h2>
          <p className="text-muted-foreground max-w-xs mb-4">{state.description}</p>
          {state.showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="cta-button max-w-xs"
            >
              Try Again
            </button>
          )}
        </>
      )}
    </motion.div>
  );
};

export default LoadingStates;
