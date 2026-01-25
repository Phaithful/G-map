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
  Share2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface HamburgerMenuProps {
  onNavigate?: (page: string) => void;
}

const HamburgerMenu = ({ onNavigate }: HamburgerMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: "profile", label: "Profile", icon: User },
    { id: "saved", label: "Saved Locations", icon: Heart },
    { id: "share", label: "Share Location", icon: Share2, highlight: true },
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
        style={{ top: 'calc(1rem + 56px)' }}
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
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xl font-bold">
                    G
                  </div>
                  <div>
                    <h3 className="font-semibold">Guest User</h3>
                    <p className="text-sm text-muted-foreground">Campus Explorer</p>
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
                    className={`menu-item w-full ${item.highlight ? 'bg-primary/10' : ''}`}
                  >
                    <item.icon className={`w-5 h-5 ${item.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`flex-1 text-left ${item.highlight ? 'text-primary font-semibold' : ''}`}>{item.label}</span>
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
