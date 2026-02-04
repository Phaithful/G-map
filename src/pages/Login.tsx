import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Eye, EyeOff, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface LoginFormData {
  email: string;
  password: string;
}

// ✅ Change this later when you deploy your backend
const API_BASE = "http://127.0.0.1:8000";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      form.clearErrors();

      const payload = {
        email: data.email.trim().toLowerCase(),
        password: data.password,
      };

      const res = await fetch(`${API_BASE}/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          json?.error ||
          json?.detail ||
          "Login failed. Please check your details and try again.";

        form.setError("email", { message: msg });
        return;
      }

      // ✅ expects backend returns { access, refresh, user }
      if (!json?.access || !json?.user) {
        form.setError("email", {
          message:
            "Login response is missing user data. Check your backend login response.",
        });
        return;
      }

      // ✅ SAVE AUTH (this is what useAuthUser reads)
      localStorage.setItem("accessToken", json.access);
      localStorage.setItem("refreshToken", json.refresh);
      localStorage.setItem("user", JSON.stringify(json.user));

      // ✅ Redirect to home
      navigate("/");
    } catch {
      form.setError("email", {
        message: "Network error. Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - School Image */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
      >
        <img
          src="/images/school location.jpg"
          alt="Godfrey Okoye University Campus"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/40" />

        {/* Branding Overlay */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-center"
          >
            <img
              src="/Logo.png"
              alt="G-Map Logo"
              className="w-20 h-20 mx-auto mb-6 rounded-xl bg-white/10 p-2 backdrop-blur-sm"
            />
            <h1 className="text-4xl font-bold mb-4">Welcome to G-Map</h1>
            <p className="text-xl opacity-90 mb-8">
              Navigate Godfrey Okoye University with ease
            </p>
            <div className="flex items-center justify-center gap-2 text-lg">
              <MapPin className="w-6 h-6" />
              <span>Your campus companion</span>
            </div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-8 left-8">
          <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm" />
        </div>
        <div className="absolute bottom-8 right-8">
          <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm" />
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 bg-background"
      >
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:hidden text-center"
          >
            <img
              src="/Logo.png"
              alt="G-Map Logo"
              className="w-16 h-16 mx-auto mb-4 rounded-lg bg-primary/10 p-2"
            />
            <h1 className="text-2xl font-bold text-primary">G-Map</h1>
          </motion.div>

          {/* Header */}
          <div className="text-center">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-foreground"
            >
              Sign In
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-2 text-muted-foreground"
            >
              Access your campus navigation
            </motion.p>
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  rules={{
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          className="h-12 text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  rules={{
                    required: "Password is required",
                    minLength: { value: 6, message: "Password must be at least 6 characters" },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="h-12 text-base pr-12"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <Eye className="h-5 w-5 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center space-y-4"
          >
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <p className="text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline font-semibold">
                Create one
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
