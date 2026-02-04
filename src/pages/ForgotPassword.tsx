import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface ForgotPasswordFormData {
  email: string;
}

const API_BASE = "http://127.0.0.1:8000";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "code">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [email, setEmail] = useState("");

  const form = useForm<ForgotPasswordFormData>({
    defaultValues: { email: "" },
  });

  const onSubmitEmail = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      form.clearErrors();

      const res = await fetch(`${API_BASE}/api/auth/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        form.setError("email", {
          message: json?.error || "Failed to send reset code.",
        });
        return;
      }

      setEmail(data.email);
      setOtpValue("");
      setStep("code");
    } catch {
      form.setError("email", { message: "Network error. Try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitCode = async () => {
    if (otpValue.length !== 6) return;

    try {
      setIsLoading(true);

      const res = await fetch(`${API_BASE}/api/auth/verify-reset-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpValue }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        // show error nicely under the OTP area by using a basic alert-style approach
        // (you can replace with toast later)
        setOtpValue("");
        return alert(json?.error || "Invalid or expired code. Try again.");
      }

      const resetToken = json.resetToken;
      if (!resetToken) {
        return alert("Reset token missing. Please resend code.");
      }

      // ✅ pass token to reset page
      navigate(`/reset-password?token=${encodeURIComponent(resetToken)}`);
    } catch {
      alert("Network error. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsLoading(true);

      const res = await fetch(`${API_BASE}/api/auth/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json?.error || "Failed to resend code.");
        return;
      }

      setOtpValue("");
    } catch {
      alert("Network error. Try again.");
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
            <h1 className="text-4xl font-bold mb-4">Reset Your Password</h1>
            <p className="text-xl opacity-90 mb-8">
              We'll help you get back into your account
            </p>
            <div className="flex items-center justify-center gap-2 text-lg">
              <MapPin className="w-6 h-6" />
              <span>Secure & Easy</span>
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

      {/* Right Side - Form */}
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
              {step === "email" ? "Forgot Password" : "Enter Code"}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-2 text-muted-foreground"
            >
              {step === "email"
                ? "Enter your email to reset your password"
                : `We've sent a 6-digit code to ${email}`}
            </motion.p>
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {step === "email" ? (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmitEmail)}
                  className="space-y-6"
                >
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
                        <FormLabel className="text-foreground">
                          Email Address
                        </FormLabel>
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

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Reset Code"}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpValue}
                    onChange={setOtpValue}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Check your email for the verification code
                </div>

                <Button
                  onClick={onSubmitCode}
                  className="w-full h-12 text-base font-semibold"
                  disabled={isLoading || otpValue.length !== 6}
                >
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Didn't receive code? Resend
                  </Button>
                </div>
              </div>
            )}
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
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <p className="text-muted-foreground">
              Remember your password?{" "}
              <Link
                to="/login"
                className="text-primary hover:underline font-semibold"
              >
                Sign in
              </Link>
            </p>
          </motion.div>

          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="pt-4"
          >
            
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
