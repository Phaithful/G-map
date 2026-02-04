import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Camera,
  Save,
  User,
  Moon,
  Sun,
  Bell,
  Shield,
  Globe,
  Mail,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SettingsPageProps {
  onBack: () => void;
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

function writeStoredUser(next: StoredUser) {
  localStorage.setItem("user", JSON.stringify(next));
}

const SettingsPage = ({ onBack }: SettingsPageProps) => {
  // Profile states
  const [profileImage, setProfileImage] = useState<string>(
    "/images/profile_icon.png",
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [userName, setUserName] = useState("Guest User");
  const [userEmail, setUserEmail] = useState("guest@gou.edu.ng");
  const [userPhone, setUserPhone] = useState("");

  // App preferences states
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [language, setLanguage] = useState("en");

  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadSettings = () => {
      // ✅ user from auth storage
      const u = readStoredUser();
      setUserName(u?.name?.trim() ? u.name : "Guest User");
      setUserEmail(u?.email?.trim() ? u.email : "guest@gou.edu.ng");

      // Profile extras
      const savedImage = localStorage.getItem("profileImage");
      const savedPhone = localStorage.getItem("userPhone");

      if (savedImage && savedImage.trim() !== "") setProfileImage(savedImage);
      else setProfileImage("/images/profile_icon.png");

      if (savedPhone && savedPhone.trim() !== "") setUserPhone(savedPhone);
      else setUserPhone("");

      // App preferences
      const savedDarkMode = localStorage.getItem("darkMode") === "true";
      const savedNotifications =
        localStorage.getItem("notifications") !== "false";
      const savedLocationServices =
        localStorage.getItem("locationServices") !== "false";
      const savedLanguage = localStorage.getItem("language") || "en";

      setIsDarkMode(savedDarkMode);
      setNotifications(savedNotifications);
      setLocationServices(savedLocationServices);
      setLanguage(savedLanguage);

      if (savedDarkMode) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    };

    loadSettings();

    const handleStorageChange = () => loadSettings();
    const handleUserDataChanged = () => loadSettings();

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userDataChanged", handleUserDataChanged);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userDataChanged", handleUserDataChanged);
    };
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCancelImage = () => {
    setSelectedFile(null);
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDarkModeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    localStorage.setItem("darkMode", checked.toString());
    if (checked) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);

    try {
      // ✅ Save profile image
      const finalImage = previewImage || profileImage;
      if (finalImage && finalImage !== "/images/profile_icon.png") {
        localStorage.setItem("profileImage", finalImage);
        setProfileImage(finalImage);
      }

      // ✅ Update AUTH user object (this is the important fix)
      const currentUser = readStoredUser() || {};
      writeStoredUser({
        ...currentUser,
        name: userName?.trim() ? userName.trim() : currentUser.name,
        email: userEmail?.trim() ? userEmail.trim() : currentUser.email,
      });

      // Save phone separately (since backend user may not have phone field)
      if (userPhone && userPhone.trim() !== "") {
        localStorage.setItem("userPhone", userPhone.trim());
      } else {
        localStorage.removeItem("userPhone");
      }

      // Save app preferences
      localStorage.setItem("notifications", notifications.toString());
      localStorage.setItem("locationServices", locationServices.toString());
      localStorage.setItem("language", language);

      setSelectedFile(null);
      setPreviewImage(null);

      // ✅ Tell menu/profile to refresh
      window.dispatchEvent(new CustomEvent("userDataChanged"));

      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentImage = previewImage || profileImage;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button
          onClick={onBack}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile Section */}
        <div className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 px-2">
            Profile
          </h3>

          {/* Profile Picture */}
          <div className="flex flex-col items-center space-y-4 mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20">
                <img
                  src={currentImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {previewImage && (
              <div className="flex gap-2">
                <Button onClick={handleCancelImage} variant="outline" size="sm">
                  Cancel
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                >
                  Change
                </Button>
              </div>
            )}
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your full name"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="Enter your email address"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="h-12"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Appearance Section */}
        <div className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 px-2">
            Appearance
          </h3>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-primary" />
              )}
              <div>
                <Label className="text-sm font-medium">Dark Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Toggle between light and dark themes
                </p>
              </div>
            </div>

            <Switch checked={isDarkMode} onCheckedChange={handleDarkModeToggle} />
          </div>
        </div>

        <Separator />

        {/* Notifications & Privacy */}
        <div className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 px-2">
            Notifications & Privacy
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <div>
                  <Label className="text-sm font-medium">Push Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive updates about your locations
                  </p>
                </div>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <Label className="text-sm font-medium">Location Services</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow access to device location
                  </p>
                </div>
              </div>
              <Switch
                checked={locationServices}
                onCheckedChange={setLocationServices}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Language & Region */}
        <div className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 px-2">
            Language & Region
          </h3>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary" />
              <div>
                <Label className="text-sm font-medium">Language</Label>
                <p className="text-xs text-muted-foreground">
                  Choose your preferred language
                </p>
              </div>
            </div>

            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Account Information */}
        <div className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 px-2">
            Account Information
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Account Type</p>
                  <p className="text-xs text-muted-foreground">Student Account</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="p-6 border-t border-border">
          <Button
            onClick={handleSaveSettings}
            disabled={isLoading}
            className="w-full h-12 text-base font-semibold"
          >
            {isLoading ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>

        {/* Version Info */}
        <div className="p-6 border-t border-border">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">G-Map v1.0.0</p>
            <p className="text-xs text-muted-foreground mt-1">
              Godfrey Okoye University Campus Navigation
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
