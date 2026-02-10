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
import { useState } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";

interface HamburgerMenuProps {
  onNavigate?: (page: string) => void;
}

const HamburgerMenu = ({ onNavigate }: HamburgerMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const { user, isAuthenticated, logout } = useAuthUser();

  const displayName = isAuthenticated && user?.name ? user.name : "Guest User";
  const displayEmail = isAuthenticated && user?.email ? user.email : "Campus Explorer";
  const profileImage = localStorage.getItem("profileImage") || "/images/profile_icon.png";

  const menuItems = [
    { id: "profile", label: "Profile", icon: User },
    { id: "saved", label: "Saved Locations", icon: Heart },
    { id: "share", label: "Share Location", icon: Share2 },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "help", label: "Help & Support", icon: HelpCircle },
    { id: "about", label: "About G-Map", icon: Info },
  ];

  const handleItemClick = (id: string) => {
    if (id === "logout") {
      logout();
      onNavigate?.("logout");
      setIsOpen(false);
      return;
    }
    onNavigate?.(id);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-40 floating-button"
        style={{ top: "calc(0.75rem + 52px)" }}
      >
        <Menu className="w-4 h-4" />
      </button>

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

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-72 z-[100] bg-card shadow-xl"
            >
              <div className="flex items-center justify-between p-3 border-b border-border">
                <h2 className="text-base font-semibold">Menu</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{displayName}</h3>
                    <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                  </div>
                </div>
              </div>

              <div className="p-2">
                {menuItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => handleItemClick(item.id)}
                    className="menu-item w-full flex items-center gap-3"
                  >
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </motion.button>
                ))}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
                <button
                  onClick={() => handleItemClick("logout")}
                  className="menu-item w-full text-destructive"
                >
                  <LogOut className="w-4 h-4" />
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