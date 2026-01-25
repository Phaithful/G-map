import { ArrowLeft, User, Heart, Settings, HelpCircle, ChevronRight, LogOut, MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface ProfilePageProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
  savedCount?: number;
}

const ProfilePage = ({ onBack, onNavigate, savedCount = 5 }: ProfilePageProps) => {
  const settingsItems = [
    { id: "saved", label: "Saved Locations", icon: MapPin, badge: savedCount },
    { id: "edit", label: "Edit Profile", icon: User },
    { id: "preferences", label: "App Preferences", icon: Settings },
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
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-3xl font-bold mb-4">
          G
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
        <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Settings</h3>
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
        <button className="menu-item w-full text-destructive">
          <LogOut className="w-5 h-5" />
          <span className="flex-1 text-left">Logout</span>
        </button>
      </div>
    </motion.div>
  );
};

export default ProfilePage;
