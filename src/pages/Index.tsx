import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import MapView from "../components/map/MapView";
import SearchBar from "../components/map/SearchBar";
import BottomSheet from "../components/map/BottomSheet";
import CategoryChips from "../components/map/CategoryChips";
import type { Location } from "../types";
import LocationCard from "../components/map/LocationCard";
import LocationDetails from "../components/map/LocationDetails";
import NavigationMode from "../components/map/NavigationMode";
import HamburgerMenu from "../components/map/HamburgerMenu";
import ProfilePage from "../components/pages/ProfilePage";
import SavedLocationsPage from "../components/pages/SavedLocationsPage";
import SettingsPage from "../components/pages/SettingsPage";
import campusLocations from "../data/locations";

const Index = () => {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  // Listen for device orientation (compass heading)
  useEffect(() => {
    function handleOrientation(event: DeviceOrientationEvent) {
      // Prefer 'webkitCompassHeading' for iOS, otherwise use 'alpha'
      let compassHeading = null;
      if (event.webkitCompassHeading !== undefined) {
        compassHeading = event.webkitCompassHeading;
      } else if (event.alpha !== null) {
        // Convert alpha to compass heading (0 = north)
        compassHeading = 360 - event.alpha;
      }
      if (typeof compassHeading === "number" && !isNaN(compassHeading)) {
        setHeading(compassHeading);
      }
    }
    window.addEventListener("deviceorientation", handleOrientation, true);
    return () =>
      window.removeEventListener("deviceorientation", handleOrientation, true);
  }, []);
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [showLocationDetails, setShowLocationDetails] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const [savedLocations, setSavedLocations] = useState<Location[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize dark mode and saved locations on app startup
  useEffect(() => {
    // Dark mode initialization
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    if (savedDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Saved locations initialization
    const savedLocationsData = localStorage.getItem("savedLocations");
    if (savedLocationsData) {
      try {
        const parsedLocations = JSON.parse(savedLocationsData);
        // Validate that the saved locations exist in our campus locations
        const validLocations = parsedLocations.filter((savedLoc: Location) =>
          campusLocations.some((campusLoc) => campusLoc.id === savedLoc.id),
        );
        setSavedLocations(validLocations);
      } catch (error) {
        console.error("Error loading saved locations:", error);
        setSavedLocations([]);
      }
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.error("Geolocation error:", err);
        // Fallback to campus center if geolocation fails
        setUserLocation({ lat: 6.8442, lng: 7.3739 });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      },
    );
  }, []);

  // Filter locations
  const filteredLocations = campusLocations.filter((loc) => {
    const matchesCategory =
      !selectedCategory || loc.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      loc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get locations for expanded content - one from each category when no category selected
  const expandedLocations = selectedCategory
    ? filteredLocations
    : Object.values(
        campusLocations
          .filter(
            (loc) =>
              !searchQuery ||
              loc.name.toLowerCase().includes(searchQuery.toLowerCase()),
          )
          .reduce(
            (acc, loc) => {
              if (!acc[loc.category]) {
                acc[loc.category] = loc;
              }
              return acc;
            },
            {} as Record<string, Location>,
          ),
      );

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setShowLocationDetails(true);
  };

  const handleNavigate = () => {
    setShowLocationDetails(false);
    setIsNavigating(true);
  };

  const handleSaveLocation = () => {
    if (!selectedLocation) return;

    const isAlreadySaved = savedLocations.some(
      (location) => location.id === selectedLocation.id,
    );

    let newSavedLocations: Location[];
    if (isAlreadySaved) {
      // Remove from saved locations
      newSavedLocations = savedLocations.filter(
        (location) => location.id !== selectedLocation.id,
      );
    } else {
      // Add to saved locations
      newSavedLocations = [...savedLocations, selectedLocation];
    }

    setSavedLocations(newSavedLocations);
    localStorage.setItem("savedLocations", JSON.stringify(newSavedLocations));
  };

  const handleRemoveSaved = (id: string) => {
    const newSavedLocations = savedLocations.filter(
      (location) => location.id !== id,
    );
    setSavedLocations(newSavedLocations);
    localStorage.setItem("savedLocations", JSON.stringify(newSavedLocations));
  };

  const handleMenuNavigate = (page: string) => {
    if (page === "logout") {
      // Handle logout - navigate to login page
      navigate("/login");
    } else {
      setCurrentPage(page);
    }
  };

  const handleShareLocation = () => {
    // Share location functionality - for now just show an alert
    if (navigator.share) {
      navigator.share({
        title: "My Location - G-Map",
        text: "Check out my location on G-Map!",
        url: window.location.href,
      });
    } else {
      alert("Share location feature - coming soon!");
    }
  };

  // Check if selected location is saved
  const isLocationSaved = selectedLocation
    ? savedLocations.some((l) => l.id === selectedLocation.id)
    : false;

  // Get category name for expanded content title
  const getCategoryTitle = () => {
    if (!selectedCategory) return "Popular Locations";
    const categoryMap: Record<string, string> = {
      academics: "Academic Buildings",
      offices: "Administrative Offices",
      hostels: "Hostels",
      food: "Food & Cafeterias",
      health: "Health & Safety",
      churches: "Churches",
      sports: "Sports & Recreation",
      shops: "Shops & Services",
    };
    return categoryMap[selectedCategory] || "Popular Locations";
  };

  // Page views
  if (currentPage === "profile") {
    return (
      <ProfilePage
        onBack={() => setCurrentPage(null)}
        onNavigate={handleMenuNavigate}
        savedCount={savedLocations.length}
      />
    );
  }

  if (currentPage === "saved") {
    return (
      <SavedLocationsPage
        onBack={() => setCurrentPage(null)}
        savedLocations={savedLocations.sort((a, b) =>
          a.name.localeCompare(b.name),
        )}
        onRemove={handleRemoveSaved}
        onSelect={(loc) => {
          setCurrentPage(null);
          handleLocationSelect(loc);
        }}
      />
    );
  }

  if (currentPage === "settings") {
    return <SettingsPage onBack={() => setCurrentPage(null)} />;
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* Map */}
      <MapView
        locations={filteredLocations.map((l) => ({
          id: l.id,
          name: l.name,
          lat: l.lat,
          lng: l.lng,
          category: l.category,
        }))}
        selectedLocation={
          selectedLocation
            ? {
                id: selectedLocation.id,
                name: selectedLocation.name,
                lat: selectedLocation.lat,
                lng: selectedLocation.lng,
                category: selectedLocation.category,
              }
            : null
        }
        onPinClick={(loc) => {
          const fullLocation = campusLocations.find((l) => l.id === loc.id);
          if (fullLocation) {
            if (isNavigating) {
              setSelectedLocation(fullLocation);
            } else {
              handleLocationSelect(fullLocation);
            }
          }
        }}
        userLocation={userLocation}
        heading={heading}
      />

      {/* Search bar */}
      {!isNavigating && (
        <SearchBar
          onSearch={setSearchQuery}
          onLocationSelect={handleLocationSelect}
          onCloseBottomSheet={() => {
            setSelectedCategory(null);
            setShowLocationDetails(false);
          }}
          placeholder="Search campus or place..."
        />
      )}

      {/* Hamburger menu */}
      {!isNavigating && <HamburgerMenu onNavigate={handleMenuNavigate} />}

      {/* Bottom sheet */}
      {!isNavigating && !showLocationDetails && (
        <BottomSheet
          onShareLocation={handleShareLocation}
          isExpanded={!!selectedCategory}
          expandedHeader={
            <h3 className="text-lg font-semibold">{getCategoryTitle()}</h3>
          }
          expandedContent={expandedLocations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              onClick={() => handleLocationSelect(location)}
            />
          ))}
        >
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Where are you going?</h2>
            <CategoryChips
              selectedCategory={selectedCategory}
              onSelect={(cat) =>
                setSelectedCategory(cat === selectedCategory ? null : cat)
              }
            />
          </div>
        </BottomSheet>
      )}

      {/* Location details */}
      <AnimatePresence>
        {showLocationDetails && (
          <LocationDetails
            location={selectedLocation}
            isOpen={showLocationDetails}
            onClose={() => {
              setShowLocationDetails(false);
              setSelectedLocation(null);
            }}
            onNavigate={handleNavigate}
            onSave={handleSaveLocation}
            isSaved={isLocationSaved}
          />
        )}
      </AnimatePresence>

      {/* Navigation mode */}
      <NavigationMode
        isActive={isNavigating}
        destination={selectedLocation}
        onClose={() => {
          setIsNavigating(false);
          setSelectedLocation(null);
        }}
        onStart={() => {
          // Start navigation
        }}
        onMenuNavigate={handleMenuNavigate}
      />
    </div>
  );
};

export default Index;
