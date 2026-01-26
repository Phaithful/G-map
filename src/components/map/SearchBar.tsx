import { Search, SlidersHorizontal, ArrowLeft, X, MapPin } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { campusLocations } from "../../data/locations";
import { Location } from "./LocationCard";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  onLocationSelect?: (location: Location) => void;
  onFilterClick?: () => void;
  onCloseBottomSheet?: () => void;
  placeholder?: string;
}

const SearchBar = ({
  onSearch,
  onLocationSelect,
  onFilterClick,
  onCloseBottomSheet,
  placeholder = "Search campus or place...",
}: SearchBarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Update suggestions as user types
  useEffect(() => {
    if (query.trim().length > 0) {
      const filtered = campusLocations
        .filter(
          (location) =>
            location.name.toLowerCase().includes(query.toLowerCase()) ||
            location.category.toLowerCase().includes(query.toLowerCase()) ||
            location.description.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 8); // Limit to 8 suggestions
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch?.(value);
  };

  const handleLocationClick = (location: Location) => {
    setQuery(""); // Clear the search query immediately
    setSuggestions([]);
    setIsExpanded(false);
    onLocationSelect?.(location);
    onSearch?.(""); // Clear the search filter to show all locations
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    onSearch?.("");
    inputRef.current?.focus();
  };

  const handleClose = () => {
    setIsExpanded(false);
    setQuery("");
    setSuggestions([]);
    onSearch?.("");
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      hostels: "bg-blue-100 text-blue-800",
      offices: "bg-purple-100 text-purple-800",
      academics: "bg-green-100 text-green-800",
      food: "bg-orange-100 text-orange-800",
      health: "bg-red-100 text-red-800",
      churches: "bg-indigo-100 text-indigo-800",
      sports: "bg-yellow-100 text-yellow-800",
      shops: "bg-pink-100 text-pink-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <>
      {/* Collapsed search bar */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-4 right-4 z-50"
          >
            <button
              onClick={() => {
                setIsExpanded(true);
                onCloseBottomSheet?.();
              }}
              className="search-pill w-full"
            >
              <Search className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left text-muted-foreground">
                {placeholder}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFilterClick?.();
                }}
                className="p-1 hover:bg-muted rounded-full transition-colors"
              >
                <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
              </button>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded search overlay */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background"
          >
            {/* Search header */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <button
                onClick={handleClose}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={placeholder}
                  className="w-full py-2 px-4 bg-muted rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {query && (
                  <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-background rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* Search suggestions */}
            <div className="flex-1 overflow-y-auto">
              {query && suggestions.length > 0 ? (
                <div className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Locations ({suggestions.length})
                  </h3>
                  <div className="space-y-2">
                    {suggestions.map((location) => (
                      <button
                        key={location.id}
                        onClick={() => handleLocationClick(location)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left group"
                      >
                        <div className="flex-shrink-0">
                          <MapPin className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground truncate">
                            {location.name}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {location.description}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(location.category)}`}
                          >
                            {location.category}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : query && suggestions.length === 0 ? (
                <div className="p-4 text-center">
                  <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No locations found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try searching for buildings, hostels, or facilities
                  </p>
                </div>
              ) : (
                <div className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Popular Locations
                  </h3>
                  <div className="space-y-2">
                    {[
                      { name: "Central Cafeteria", category: "food" },
                      { name: "Admin Block", category: "offices" },
                      { name: "Engineering Block", category: "academics" },
                      { name: "Sports Complex", category: "sports" },
                    ].map((item) => (
                      <button
                        key={item.name}
                        onClick={() => handleSearch(item.name)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left group"
                      >
                        <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                        <div className="flex-1">
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(item.category)}`}
                        >
                          {item.category}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SearchBar;
