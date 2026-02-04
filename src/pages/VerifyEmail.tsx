import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

const API_BASE = "http://127.0.0.1:8000";

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/verify-email/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const json = await res.json();

        if (!res.ok) {
          setStatus("error");
          setMessage(json?.error || "Verification failed.");
          return;
        }

        // Auto-login: store tokens
        localStorage.setItem("accessToken", json.access);
        localStorage.setItem("refreshToken", json.refresh);
        localStorage.setItem("user", JSON.stringify(json.user));

        setStatus("success");
        setMessage("Email verified. Signing you in...");

        // go home
        setTimeout(() => navigate("/"), 800);
      } catch {
        setStatus("error");
        setMessage("Network error. Please try again.");
      }
    })();
  }, [params, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-background p-6 space-y-4">
        <h1 className="text-2xl font-bold">Verify Email</h1>

        {status === "loading" && <p className="text-muted-foreground">Verifying...</p>}
        {status === "success" && <p className="text-green-600">{message}</p>}
        {status === "error" && (
          <>
            <p className="text-red-600">{message}</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/signup")}>
                Back to Signup
              </Button>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
