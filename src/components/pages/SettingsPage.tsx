import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Camera,
  Upload,
  X,
  Save,
  User,
  Moon,
  Sun,
  Bell,
  Shield,
  Globe,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
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

  // Load all saved data on mount
  useEffect(() => {
    const loadSettings = () => {
      // Profile data
      const savedImage = localStorage.getItem("profileImage");
      const savedName = localStorage.getItem("userName");
      const savedEmail = localStorage.getItem("userEmail");
      const savedPhone = localStorage.getItem("userPhone");

      if (savedImage && savedImage.trim() !== "") setProfileImage(savedImage);
      if (savedName && savedName.trim() !== "") setUserName(savedName);
      if (savedEmail && savedEmail.trim() !== "") setUserEmail(savedEmail);
      if (savedPhone && savedPhone.trim() !== "") setUserPhone(savedPhone);

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

      // Apply dark mode
      if (savedDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    loadSettings();

    // Listen for storage changes
    const handleStorageChange = () => {
      loadSettings();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
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
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);

    try {
      // Save profile data
      if (selectedFile && previewImage) {
        localStorage.setItem("profileImage", previewImage);
        setProfileImage(previewImage);
      } else if (profileImage && profileImage !== "/images/profile_icon.png") {
        // Save current profile image if no new file selected but we have a custom image
        localStorage.setItem("profileImage", profileImage);
      }

      if (userName && userName.trim() !== "" && userName !== "Guest User") {
        localStorage.setItem("userName", userName);
      } else {
        localStorage.removeItem("userName"); // Remove if it's default or empty
      }

      if (
        userEmail &&
        userEmail.trim() !== "" &&
        userEmail !== "guest@gou.edu.ng"
      ) {
        localStorage.setItem("userEmail", userEmail);
      } else {
        localStorage.removeItem("userEmail");
      }

      if (userPhone && userPhone.trim() !== "") {
        localStorage.setItem("userPhone", userPhone);
      } else {
        localStorage.removeItem("userPhone");
      }

      // Save app preferences
      localStorage.setItem("darkMode", isDarkMode.toString());
      localStorage.setItem("notifications", notifications.toString());
      localStorage.setItem("locationServices", locationServices.toString());
      localStorage.setItem("language", language);

      // Clear file selection
      setSelectedFile(null);
      setPreviewImage(null);

      // Dispatch custom event to notify other components of data changes
      window.dispatchEvent(new CustomEvent("userDataChanged"));

      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelImage = () => {
    setSelectedFile(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDarkModeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    localStorage.setItem("darkMode", checked.toString());
    if (checked) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleNotificationsToggle = (checked: boolean) => {
    setNotifications(checked);
  };

  const handleLocationServicesToggle = (checked: boolean) => {
    setLocationServices(checked);
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
          <div className="space-y-4">
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
              <Switch
                checked={isDarkMode}
                onCheckedChange={handleDarkModeToggle}
              />
            </div>
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
                  <Label className="text-sm font-medium">
                    Push Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receive updates about your locations
                  </p>
                </div>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={handleNotificationsToggle}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <Label className="text-sm font-medium">
                    Location Services
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Allow access to device location
                  </p>
                </div>
              </div>
              <Switch
                checked={locationServices}
                onCheckedChange={handleLocationServicesToggle}
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
          <div className="space-y-4">
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
                  <p className="text-xs text-muted-foreground">
                    Student Account
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">Account Status</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Email Verified</p>
                  <p className="text-xs text-muted-foreground">
                    Your email is verified
                  </p>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
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
