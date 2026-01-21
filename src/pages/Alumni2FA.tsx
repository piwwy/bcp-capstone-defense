import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { AlertCircle, Mail, RefreshCcw } from "lucide-react";

type LocationState = {
  email: string;
  tempToken: string; // short-lived token from /login for 2FA
};

const Alumni2FA: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const [code, setCode] = useState("");
  const [error, setError] = useState<string>("");
  const [info, setInfo] = useState<string>("We sent a 6-digit code to your email.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // 🚫 Prevent direct access if no email/tempToken
  if (!state?.email || !state?.tempToken) {
    return <Navigate to="/login" replace />;
  }

  // ⏳ Countdown timer for resend
  useEffect(() => {
    let t: number | undefined;
    if (resendCooldown > 0) {
      t = window.setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    }
    return () => (t ? clearTimeout(t) : undefined);
  }, [resendCooldown]);

  // ✅ Verify 2FA code
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.tempToken}`,
        },
        body: JSON.stringify({ email: state.email, code }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok || !data.success) {
        setError(data.error || "Invalid code. Please try again.");
        return;
      }

      // ✅ Save real JWT + user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // 🎯 Role-based redirect (main fix)
      const role = data.user?.role?.toLowerCase();
      if (role === "alumni") {
        navigate("/alumni/dashboard", { replace: true });
      } else if (role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (role === "superadmin") {
        navigate("/superadmin/dashboard", { replace: true });
      } else if (role === "registrar") {
        navigate("/registrar/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setError("Something went wrong. Please try again.");
    }
  };

  // 🔁 Resend code handler
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setInfo("Sending a new code...");

    try {
      const res = await fetch("http://localhost:5000/api/auth/2fa/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.tempToken}`,
        },
        body: JSON.stringify({ email: state.email }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to resend code.");
        setInfo("");
        return;
      }

      setInfo("New code sent. Check your inbox.");
      setResendCooldown(30);
    } catch {
      setError("Failed to resend code.");
      setInfo("");
    }
  };

  // 🧭 UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-semibold">Two-Factor Verification</h1>
        </div>

        {error && (
          <div className="flex items-center p-3 mb-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        )}
        {info && <p className="text-sm text-gray-600 mb-4">{info}</p>}

        <form onSubmit={handleVerify} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Enter 6-digit code for <span className="font-semibold">{state.email}</span>
          </label>
          <input
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
            placeholder="------"
            required
          />

          <button
            type="submit"
            disabled={isSubmitting || code.length !== 6}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {isSubmitting ? "Verifying..." : "Verify"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline disabled:opacity-50"
          >
            <RefreshCcw className="w-4 h-4" />
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
          </button>

          <button
            onClick={() => navigate("/login")}
            className="text-sm text-gray-500 hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Alumni2FA;
