import {
  ArrowLeft,
  User,
  Heart,
  Settings,
  HelpCircle,
  ChevronRight,
  LogOut,
  MapPin,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface ProfilePageProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
  savedCount?: number;
}

const ProfilePage = ({
  onBack,
  onNavigate,
  savedCount = 5,
}: ProfilePageProps) => {
  const [userName, setUserName] = useState("Guest User");
  const [profileImage, setProfileImage] = useState("/images/profile_icon.png");

  // Load user data on mount and when returning from edit
  useEffect(() => {
    const loadUserData = () => {
      const savedName = localStorage.getItem("userName");
      const savedImage = localStorage.getItem("profileImage");

      if (savedName && savedName.trim() !== "") {
        setUserName(savedName);
      } else {
        setUserName("Guest User");
      }
      if (savedImage && savedImage.trim() !== "") {
        setProfileImage(savedImage);
      } else {
        setProfileImage("/images/profile_icon.png");
      }
    };

    loadUserData();

    // Listen for custom event when user data changes
    const handleUserDataChanged = () => {
      loadUserData();
    };

    window.addEventListener("userDataChanged", handleUserDataChanged);

    // Also listen for storage changes (in case edited from another tab)
    const handleStorageChange = () => {
      loadUserData();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("userDataChanged", handleUserDataChanged);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const settingsItems = [
    { id: "saved", label: "Saved Locations", icon: MapPin, badge: savedCount },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "help", label: "Help & Support", icon: HelpCircle },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button
          onClick={onBack}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Profile</h1>
      </div>

      {/* Profile card */}
      <div className="p-6 flex flex-col items-center border-b border-border">
        <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-primary/20">
          <img
            src="/images/profile_icon.png"
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="text-xl font-bold">Guest User</h2>
        <p className="text-muted-foreground">Campus Explorer</p>

        {/* Stats */}
        <div className="flex gap-8 mt-6">
          <button
            onClick={() => onNavigate?.("saved")}
            className="text-center hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center justify-center gap-1">
              <Heart className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{savedCount}</span>
            </div>
            <p className="text-sm text-muted-foreground">Saved</p>
          </button>
        </div>
      </div>

      {/* Settings list */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">
          Settings
        </h3>
        <div className="space-y-1">
          {settingsItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className="menu-item w-full"
            >
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== undefined && (
                <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
        <button
          onClick={() => onNavigate?.("logout")}
          className="menu-item w-full text-destructive"
        >
          <LogOut className="w-5 h-5" />
          <span className="flex-1 text-left">Logout</span>
        </button>
      </div>
    </motion.div>
  );
};

export default ProfilePage;
