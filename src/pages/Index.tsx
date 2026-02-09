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

// ✅ IMPORTANT: no ".ts" here
import { useAuthUser } from "@/hooks/useAuthUser";

const Index = () => {
  const navigate = useNavigate();

  // ✅ logged-in user (name/email) from storage
  const { user, isAuthenticated, logout } = useAuthUser();

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [heading, setHeading] = useState<number | null>(null);

  // ✅ OPTIONAL: protect this page (redirect to login if not signed in

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);


  // ✅ Listen for device orientation (compass heading)
  useEffect(() => {
    function handleOrientation(event: DeviceOrientationEvent) {
      let compassHeading: number | null = null;

      // @ts-ignore - webkitCompassHeading exists on iOS Safari
      if (event.webkitCompassHeading !== undefined) {
        // @ts-ignore
        compassHeading = event.webkitCompassHeading;
      } else if (event.alpha !== null) {
        compassHeading = 360 - event.alpha;
      }

      if (typeof compassHeading === "number" && !isNaN(compassHeading)) {
        setHeading(compassHeading);
      }
    }

    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showLocationDetails, setShowLocationDetails] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const [savedLocations, setSavedLocations] = useState<Location[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize dark mode and saved locations on app startup
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    if (savedDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const savedLocationsData = localStorage.getItem("savedLocations");
    if (savedLocationsData) {
      try {
        const parsedLocations = JSON.parse(savedLocationsData);
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

  // ✅ Real-time location tracking (watchPosition)
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });

        if (typeof pos.coords.heading === "number" && !isNaN(pos.coords.heading)) {
          setHeading(pos.coords.heading);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setUserLocation({ lat: 6.8442, lng: 7.3739 });
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Filter locations
  const filteredLocations = campusLocations.filter((loc) => {
    const matchesCategory = !selectedCategory || loc.category === selectedCategory;
    const matchesSearch =
      !searchQuery || loc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Expanded content
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
              if (!acc[loc.category]) acc[loc.category] = loc;
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
      newSavedLocations = savedLocations.filter(
        (location) => location.id !== selectedLocation.id,
      );
    } else {
      newSavedLocations = [...savedLocations, selectedLocation];
    }

    setSavedLocations(newSavedLocations);
    localStorage.setItem("savedLocations", JSON.stringify(newSavedLocations));
  };

  const handleRemoveSaved = (id: string) => {
    const newSavedLocations = savedLocations.filter((location) => location.id !== id);
    setSavedLocations(newSavedLocations);
    localStorage.setItem("savedLocations", JSON.stringify(newSavedLocations));
  };

  const handleMenuNavigate = (page: string) => {
    if (page === "logout") {
      logout(); // ✅ clears tokens + user inside the hook
      navigate("/login");
      return;
    }

    setCurrentPage(page);
  };

  const handleShareLocation = () => {
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

  const isLocationSaved = selectedLocation
    ? savedLocations.some((l) => l.id === selectedLocation.id)
    : false;

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
        savedLocations={savedLocations.sort((a, b) => a.name.localeCompare(b.name))}
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
          expandedHeader={<h3 className="text-lg font-semibold">{getCategoryTitle()}</h3>}
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
        onStart={() => {}}
        onMenuNavigate={handleMenuNavigate}
      />
    </div>
  );
};

export default Index;
