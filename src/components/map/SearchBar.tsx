// src/components/map/SearchBar.tsx
import { Search, SlidersHorizontal, ArrowLeft, X, MapPin } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import campusLocations from "../../data/locations";
import type { Location } from "../../types";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  onLocationSelect?: (location: Location) => void;
  onFilterClick?: () => void;
  onCloseBottomSheet?: () => void;
  placeholder?: string;
}

function pickPopularLocationsRandomDifferentCategories(all: Location[], count = 4) {
  // Group by category
  const byCategory = new Map<string, Location[]>();
  for (const loc of all) {
    const cat = (loc.category || "other").toLowerCase();
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(loc);
  }

  // Shuffle helper
  const shuffle = <T,>(arr: T[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const categories = shuffle(Array.from(byCategory.keys()));

  // First pass: 1 random per category
  const picks: Location[] = [];
  for (const cat of categories) {
    const list = byCategory.get(cat)!;
    if (!list?.length) continue;
    const chosen = list[Math.floor(Math.random() * list.length)];
    picks.push(chosen);
    if (picks.length >= count) break;
  }

  // If not enough categories, fill from remaining randoms
  if (picks.length < count) {
    const usedIds = new Set(picks.map((p) => String(p.id)));
    const remaining = shuffle(all).filter((l) => !usedIds.has(String(l.id)));
    for (const loc of remaining) {
      picks.push(loc);
      if (picks.length >= count) break;
    }
  }

  return picks.slice(0, count);
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
  const [popular, setPopular] = useState<Location[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Generate 4 random popular locations from different categories
  useEffect(() => {
    setPopular(pickPopularLocationsRandomDifferentCategories(campusLocations as Location[], 4));
  }, []);

  // Regenerate popular each time overlay opens (so it feels fresh)
  useEffect(() => {
    if (isExpanded) {
      setPopular(pickPopularLocationsRandomDifferentCategories(campusLocations as Location[], 4));
    }
  }, [isExpanded]);

  useEffect(() => {
    if (isExpanded && inputRef.current) inputRef.current.focus();
  }, [isExpanded]);

  // Update suggestions as user types
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q.length > 0) {
      const filtered = (campusLocations as Location[])
        .filter((location) => {
          const name = (location.name || "").toLowerCase();
          const cat = (location.category || "").toLowerCase();
          const desc = (location.description || "").toLowerCase();
          return name.includes(q) || cat.includes(q) || desc.includes(q);
        })
        .slice(0, 8);
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
    setQuery("");
    setSuggestions([]);
    setIsExpanded(false);
    onLocationSelect?.(location);
    onSearch?.("");
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
    return colors[(category || "").toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  const title = useMemo(() => {
    if (query && suggestions.length > 0) return `Locations (${suggestions.length})`;
    if (query && suggestions.length === 0) return "";
    return "Popular Locations";
  }, [query, suggestions.length]);

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
              <span className="flex-1 text-left text-muted-foreground">{placeholder}</span>

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

            {/* Suggestions */}
            <div className="flex-1 overflow-y-auto">
              {query && suggestions.length > 0 ? (
                <div className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">{title}</h3>

                  <div className="space-y-2">
                    {suggestions.map((location) => (
                      <button
                        key={location.id}
                        onClick={() => handleLocationClick(location)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left group"
                      >
                        <MapPin className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />

                        {/* LEFT aligned + smaller font + truncation */}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="text-sm font-medium text-foreground truncate">
                            {location.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {location.description || ""}
                          </div>
                        </div>

                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${getCategoryColor(
                            location.category,
                          )}`}
                        >
                          {location.category}
                        </span>
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
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">{title}</h3>

                  <div className="space-y-2">
                    {popular.map((location) => (
                      <button
                        key={location.id}
                        onClick={() => handleLocationClick(location)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left group"
                      >
                        <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />

                        {/* LEFT aligned + smaller font + truncation */}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="text-sm font-medium text-foreground truncate">
                            {location.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {location.description || ""}
                          </div>
                        </div>

                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${getCategoryColor(
                            location.category,
                          )}`}
                        >
                          {location.category}
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