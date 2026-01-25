import { Search, SlidersHorizontal, ArrowLeft, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  onFilterClick?: () => void;
  placeholder?: string;
}

const SearchBar = ({ 
  onSearch, 
  onFilterClick,
  placeholder = "Search campus or place..." 
}: SearchBarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch?.(value);
  };

  const handleClear = () => {
    setQuery("");
    onSearch?.("");
    inputRef.current?.focus();
  };

  const handleClose = () => {
    setIsExpanded(false);
    setQuery("");
    onSearch?.("");
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
              onClick={() => setIsExpanded(true)}
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
            <div className="p-4">
              {!query && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Recent Searches</h3>
                  <div className="space-y-2">
                    {["Library", "Science Building", "Cafeteria"].map((item) => (
                      <button
                        key={item}
                        onClick={() => handleSearch(item)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
                      >
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <span>{item}</span>
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
