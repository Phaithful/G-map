import {
  Menu,
  X,
  User,
  Heart,
  Settings,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  Share2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface HamburgerMenuProps {
  onNavigate?: (page: string) => void;
}

type StoredUser = {
  id?: number;
  name?: string;
  email?: string;
  is_verified?: boolean;
};

function readStoredUser(): StoredUser | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

const HamburgerMenu = ({ onNavigate }: HamburgerMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState("Guest User");
  const [userEmail, setUserEmail] = useState("Campus Explorer");
  const [profileImage, setProfileImage] = useState("/images/profile_icon.png");

  useEffect(() => {
    const loadUserData = () => {
      const u = readStoredUser();

      if (u?.name?.trim()) setUserName(u.name);
      else setUserName("Guest User");

      if (u?.email?.trim()) setUserEmail(u.email);
      else setUserEmail("Campus Explorer");

      const savedImage = localStorage.getItem("profileImage");
      if (savedImage && savedImage.trim() !== "") setProfileImage(savedImage);
      else setProfileImage("/images/profile_icon.png");
    };

    loadUserData();

    const handleUserDataChanged = () => loadUserData();
    const handleStorageChange = () => loadUserData();

    window.addEventListener("userDataChanged", handleUserDataChanged);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("userDataChanged", handleUserDataChanged);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const menuItems = [
    { id: "profile", label: "Profile", icon: User },
    { id: "saved", label: "Saved Locations", icon: Heart },
    { id: "share", label: "Share Location", icon: Share2 },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "help", label: "Help & Support", icon: HelpCircle },
    { id: "about", label: "About G-Map", icon: Info },
  ];

  const handleItemClick = (id: string) => {
    onNavigate?.(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Menu button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-40 floating-button"
        style={{ top: "calc(1rem + 56px)" }}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[99] bg-black/50"
            />

            {/* Menu panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-80 z-[100] bg-card shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold">Menu</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User card */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20">
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{userName}</h3>
                    <p className="text-sm text-muted-foreground">{userEmail}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="p-2">
                {menuItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleItemClick(item.id)}
                    className="menu-item w-full flex items-center gap-3"
                  >
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </motion.button>
                ))}
              </div>

              {/* Logout */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
                <button
                  onClick={() => handleItemClick("logout")}
                  className="menu-item w-full text-destructive"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="flex-1 text-left">Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default HamburgerMenu;
