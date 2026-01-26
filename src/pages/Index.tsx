import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import MapView from "../components/map/MapView";
import SearchBar from "../components/map/SearchBar";
import BottomSheet from "../components/map/BottomSheet";
import CategoryChips from "../components/map/CategoryChips";
import LocationCard, { Location } from "../components/map/LocationCard";
import LocationDetails from "../components/map/LocationDetails";
import NavigationMode from "../components/map/NavigationMode";
import HamburgerMenu from "../components/map/HamburgerMenu";
import ProfilePage from "../components/pages/ProfilePage";
import SavedLocationsPage from "../components/pages/SavedLocationsPage";
import SettingsPage from "../components/pages/SettingsPage";
import campusLocations from "../data/locations";

const Index = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [showLocationDetails, setShowLocationDetails] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const [savedLocations, setSavedLocations] = useState<Location[]>([
    campusLocations[0],
    campusLocations[2],
  ]);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter locations
  const filteredLocations = campusLocations.filter((loc) => {
    const matchesCategory =
      !selectedCategory || loc.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      loc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setShowLocationDetails(true);
  };

  const handleNavigate = () => {
    setShowLocationDetails(false);
    setIsNavigating(true);
  };

  const handleSaveLocation = () => {
    if (selectedLocation) {
      const isAlreadySaved = savedLocations.find(
        (l) => l.id === selectedLocation.id,
      );
      if (isAlreadySaved) {
        setSavedLocations(
          savedLocations.filter((l) => l.id !== selectedLocation.id),
        );
      } else {
        setSavedLocations([...savedLocations, selectedLocation]);
      }
    }
  };

  const handleRemoveSaved = (id: string) => {
    setSavedLocations(savedLocations.filter((l) => l.id !== id));
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
        savedLocations={savedLocations}
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
          lat: 0,
          lng: 0,
          category: l.category,
        }))}
        selectedLocation={
          selectedLocation
            ? {
                id: selectedLocation.id,
                name: selectedLocation.name,
                lat: 0,
                lng: 0,
                category: selectedLocation.category,
              }
            : null
        }
        onPinClick={(loc) => {
          const fullLocation = campusLocations.find((l) => l.id === loc.id);
          if (fullLocation) {
            if (isNavigating) {
              // If already navigating, update destination to new location
              setSelectedLocation(fullLocation);
            } else {
              // Normal pin click - show location details
              handleLocationSelect(fullLocation);
            }
          }
        }}
        onMapClick={() => setSelectedCategory(null)}
        userLocation={{ lat: 0, lng: 0 }}
        route={
          isNavigating && selectedLocation
            ? {
                start: {
                  id: "user",
                  name: "You",
                  lat: 0,
                  lng: 0,
                  category: "",
                },
                end: {
                  id: selectedLocation.id,
                  name: selectedLocation.name,
                  lat: 0,
                  lng: 0,
                  category: selectedLocation.category,
                },
              }
            : null
        }
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
          expandedContent={filteredLocations.map((location) => (
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
