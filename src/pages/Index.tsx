import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import { useAuthUser } from "@/hooks/useAuthUser";

const normalizeDeg = (deg: number) => ((deg % 360) + 360) % 360;

const smoothAngle = (from: number, to: number, alpha: number) => {
  const a = normalizeDeg(from);
  const b = normalizeDeg(to);

  let diff = b - a;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  return normalizeDeg(a + diff * alpha);
};

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}
function needsIOSMotionPermission() {
  // @ts-ignore
  return (
    typeof DeviceOrientationEvent !== "undefined" &&
    // @ts-ignore
    typeof DeviceOrientationEvent.requestPermission === "function"
  );
}

const Index = () => {
  const navigate = useNavigate();
  const { logout } = useAuthUser();

  // ✅ REFS (no re-render spam)
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const headingRef = useRef<number | null>(null);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [showPermModal, setShowPermModal] = useState(false);
  const [permissionsStarted, setPermissionsStarted] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(false);

  if (!("geolocation" in navigator)) {
    return <div>Geolocation not supported on this device.</div>;
  }

  // ✅ show modal on every reload
  useEffect(() => {
    setShowPermModal(true);
  }, []);

  const requestMotionPermission = async () => {
    if (!isIOS() || !needsIOSMotionPermission()) return true;

    try {
      // MUST be called inside user gesture (tap)
      // @ts-ignore
      const res = await DeviceOrientationEvent.requestPermission();
      return res === "granted";
    } catch {
      return false;
    }
  };

  const requestLocationPermission = async () => {
    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          userLocationRef.current = p;
          setUserLocation(p);
          resolve(true);
        },
        () => resolve(false),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    });
  };

  // ✅ Motion FIRST (no await before it)
  const handleAcceptPermissions = async () => {
    setShowPermModal(false);

    const motionOk = await requestMotionPermission();
    setMotionEnabled(motionOk);

    if (!motionOk) headingRef.current = null;

    await requestLocationPermission();
    setPermissionsStarted(true);
  };

  const handleDeclinePermissions = async () => {
    setShowPermModal(false);

    setMotionEnabled(false);
    headingRef.current = null;

    await requestLocationPermission();
    setPermissionsStarted(true);
  };

  // ✅ Orientation listener writes ONLY to refs (NO setState)
  useEffect(() => {
    if (!motionEnabled) return;

    const smoothHeadingLocalRef = { current: null as number | null };
    const lastTickRef = { current: 0 };

    const handleOrientation = (event: any) => {
      const now = performance.now();
      if (now - lastTickRef.current < 80) return; // ~12fps
      lastTickRef.current = now;

      let raw: number | null = null;

      if (typeof event.webkitCompassHeading === "number") {
        raw = event.webkitCompassHeading;
      } else if (typeof event.alpha === "number") {
        raw = 360 - event.alpha;
      }

      if (typeof raw !== "number" || Number.isNaN(raw)) return;

      const next = normalizeDeg(raw);
      const alpha = 0.18;

      if (smoothHeadingLocalRef.current == null) {
        smoothHeadingLocalRef.current = next;
        headingRef.current = next;
        return;
      }

      smoothHeadingLocalRef.current = smoothAngle(smoothHeadingLocalRef.current, next, alpha);
      headingRef.current = smoothHeadingLocalRef.current;
    };

    window.addEventListener("deviceorientation", handleOrientation, true);
    window.addEventListener("deviceorientationabsolute", handleOrientation, true);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
      window.removeEventListener("deviceorientationabsolute", handleOrientation, true);
    };
  }, [motionEnabled]);

  // ✅ watchPosition only after modal decision
  useEffect(() => {
    if (!permissionsStarted) return;

    let lastStatePush = 0;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        userLocationRef.current = p;

        // ✅ reduce React state updates (UI lag killer)
        const now = performance.now();
        if (now - lastStatePush > 600) {
          lastStatePush = now;
          setUserLocation(p);
        }
      },
      (err) => console.error("Geolocation error:", err),
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 1000,
        // @ts-ignore
        distanceFilter: 2,
      } as PositionOptions,
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [permissionsStarted]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showLocationDetails, setShowLocationDetails] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const [savedLocations, setSavedLocations] = useState<Location[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    if (savedDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    const savedLocationsData = localStorage.getItem("savedLocations");
    if (savedLocationsData) {
      try {
        const parsedLocations = JSON.parse(savedLocationsData);
        const validLocations = parsedLocations.filter((savedLoc: Location) =>
          campusLocations.some((campusLoc) => campusLoc.id === savedLoc.id),
        );
        setSavedLocations(validLocations);
      } catch {
        setSavedLocations([]);
      }
    }
  }, []);

  const filteredLocations = useMemo(() => {
    return campusLocations.filter((loc) => {
      const matchesCategory = !selectedCategory || loc.category === selectedCategory;
      const matchesSearch =
        !searchQuery || loc.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const expandedLocations = useMemo(() => {
    return selectedCategory
      ? filteredLocations
      : Object.values(
          campusLocations
            .filter(
              (loc) =>
                !searchQuery || loc.name.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .reduce(
              (acc, loc) => {
                if (!acc[loc.category]) acc[loc.category] = loc;
                return acc;
              },
              {} as Record<string, Location>,
            ),
        );
  }, [selectedCategory, filteredLocations, searchQuery]);

  const handleLocationSelect = useCallback((location: Location) => {
    setSelectedLocation(location);
    setShowLocationDetails(true);
  }, []);

  const handleNavigate = useCallback(() => {
    setShowLocationDetails(false);
    setIsNavigating(true);
  }, []);

  const handleSaveLocation = useCallback(() => {
    if (!selectedLocation) return;

    const isAlreadySaved = savedLocations.some((l) => l.id === selectedLocation.id);
    const newSavedLocations = isAlreadySaved
      ? savedLocations.filter((l) => l.id !== selectedLocation.id)
      : [...savedLocations, selectedLocation];

    setSavedLocations(newSavedLocations);
    localStorage.setItem("savedLocations", JSON.stringify(newSavedLocations));
  }, [savedLocations, selectedLocation]);

  const handleRemoveSaved = useCallback(
    (id: string) => {
      const newSavedLocations = savedLocations.filter((l) => l.id !== id);
      setSavedLocations(newSavedLocations);
      localStorage.setItem("savedLocations", JSON.stringify(newSavedLocations));
    },
    [savedLocations],
  );

  const handleMenuNavigate = useCallback(
    (page: string) => {
      if (page === "logout") {
        logout();
        navigate("/login");
        return;
      }
      setCurrentPage(page);
    },
    [logout, navigate],
  );

  const handleShareLocation = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: "My Location - G-Map",
        text: "Check out my location on G-Map!",
        url: window.location.href,
      });
    } else {
      alert("Share location feature - coming soon!");
    }
  }, []);

  const isLocationSaved = selectedLocation ? savedLocations.some((l) => l.id === selectedLocation.id) : false;

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
      {showPermModal && (
        <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-card p-4 shadow-xl border border-border/40">
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold">Enable Navigation Permissions</h2>
              <p className="text-xs text-muted-foreground">
                For the “Google Maps” feel, G-Map uses:
              </p>
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex gap-2.5">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <div className="font-medium">Location</div>
                  <div className="text-muted-foreground">
                    Shows your live position and recenters you above the bottom sheet.
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <div className="font-medium">Compass / Motion</div>
                  <div className="text-muted-foreground">
                    Rotates the 90° cone smoothly when you turn.
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <div className="font-medium">High Accuracy</div>
                  <div className="text-muted-foreground">
                    Reduces GPS jumping around campus.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2.5">
              <button
                onClick={handleDeclinePermissions}
                className="w-full rounded-xl border border-border/60 bg-transparent px-3 py-2.5 text-xs font-medium hover:bg-muted/50"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptPermissions}
                className="w-full rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Accept
              </button>
            </div>

            <p className="mt-2 text-[11px] text-muted-foreground">
              If you decline motion, the cone will show — but won’t rotate with your turning.
            </p>
          </div>
        </div>
      )}

      <MapView
        locations={filteredLocations}
        selectedLocation={selectedLocation}
        onPinClick={(loc) => {
          const full = campusLocations.find((l) => l.id === loc.id);
          if (!full) return;
          if (isNavigating) setSelectedLocation(full);
          else handleLocationSelect(full);
        }}
        userLocation={userLocation}
        userLocationRef={userLocationRef}
        headingRef={motionEnabled ? headingRef : undefined}
        isNavigating={isNavigating}
        activeDestination={selectedLocation}
        routeProfile="walking"
      />

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

      {!isNavigating && <HamburgerMenu onNavigate={handleMenuNavigate} />}

      {!isNavigating && !showLocationDetails && (
        <BottomSheet
          onShareLocation={handleShareLocation}
          isExpanded={!!selectedCategory}
          expandedHeader={<h3 className="text-base font-semibold">{getCategoryTitle()}</h3>}
          expandedContent={expandedLocations.map((location) => (
            <LocationCard key={location.id} location={location} onClick={() => handleLocationSelect(location)} />
          ))}
        >
          <div className="space-y-3">
            <h2 className="text-lg font-bold">Where are you going?</h2>
            <CategoryChips
              selectedCategory={selectedCategory}
              onSelect={(cat) => setSelectedCategory(cat === selectedCategory ? null : cat)}
            />
          </div>
        </BottomSheet>
      )}

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

      <NavigationMode
        isActive={isNavigating}
        destination={selectedLocation}
        onClose={() => {
          setIsNavigating(false);
          setSelectedLocation(null);
        }}
        onStart={() => {
          if (!selectedLocation) return;
          setIsNavigating(true);
        }}
        onMenuNavigate={handleMenuNavigate}
      />
    </div>
  );
};

export default Index;