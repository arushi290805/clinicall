import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

type AuthMode = "signin" | "signup";

interface SignUpForm {
  name: string;
  password: string;
  confirmPassword: string;
  hospitalId: string;
}

interface SignInForm {
  id: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [registeredId, setRegisteredId] = useState("");

  const [signInForm, setSignInForm] = useState<SignInForm>({
    id: "",
    password: "",
  });

  const [signUpForm, setSignUpForm] = useState<SignUpForm>({
    name: "",
    password: "",
    confirmPassword: "",
    hospitalId: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSignInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignInForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setErrorMessage("");
  };

  const handleSignUpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignUpForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setErrorMessage("");
  };

  const validateSignIn = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!signInForm.id.trim()) {
      newErrors.id = "Worker ID is required.";
    }
    if (!signInForm.password) {
      newErrors.password = "Password is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignUp = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!signUpForm.name.trim()) {
      newErrors.name = "Full Name is required.";
    }
    if (!signUpForm.hospitalId.trim()) {
      newErrors.hospitalId = "Hospital ID is required.";
    }
    if (!signUpForm.password) {
      newErrors.password = "Password is required.";
    } else if (signUpForm.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }
    if (signUpForm.password !== signUpForm.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!validateSignIn()) return;

    setLoading(true);
    try {
      const result = await apiFetch<{
        success: boolean;
        worker: { id: string; name: string; hospitalId: string };
      }>("/api/workers/signin", {
        method: "POST",
        body: JSON.stringify({
          id: signInForm.id.trim(),
          password: signInForm.password,
        }),
      });

      if (result && result.success && result.worker) {
        sessionStorage.setItem("workerId", result.worker.id);
        sessionStorage.setItem("workerName", result.worker.name);
        setSuccessMessage("Sign in successful! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 800);
      } else {
        setErrorMessage("Invalid credentials. Please try again.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setRegisteredId("");
    if (!validateSignUp()) return;

    setLoading(true);
    try {
      const result = await apiFetch<{
        success: boolean;
        worker: { id: string; name: string; hospitalId: string };
      }>("/api/workers/signup", {
        method: "POST",
        body: JSON.stringify({
          name: signUpForm.name.trim(),
          password: signUpForm.password,
          hospitalId: signUpForm.hospitalId.trim(),
        }),
      });

      if (result && result.success && result.worker) {
        setRegisteredId(result.worker.id);
        setSuccessMessage("Account created successfully!");
        setSignInForm({ id: result.worker.id, password: "" });
        // Reset signup form
        setSignUpForm({
          name: "",
          password: "",
          confirmPassword: "",
          hospitalId: "",
        });
      } else {
        setErrorMessage("Failed to create account. Please try again.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign up failed.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage("");
    setSuccessMessage("");
    setErrors({});
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100 to-lime-100 p-4">
      <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

      <div className="relative w-full max-w-md p-[2px] rounded-3xl bg-gradient-to-r from-emerald-400/60 via-lime-400/40 to-green-400/60 shadow-2xl">
        <div className="rounded-[22px] bg-white/80 backdrop-blur-xl p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-emerald-900 tracking-tight mb-2">
              CLINI-CALL
            </h1>
            <p className="text-sm text-emerald-700 font-medium">
              Clinic Worker Portal
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-emerald-100/70 p-1.5 rounded-2xl mb-6 shadow-inner">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signin"}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                mode === "signin"
                  ? "bg-white text-emerald-900 shadow-md"
                  : "text-emerald-700 hover:text-emerald-900"
              }`}
              onClick={() => switchTab("signin")}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                mode === "signup"
                  ? "bg-white text-emerald-900 shadow-md"
                  : "text-emerald-700 hover:text-emerald-900"
              }`}
              onClick={() => switchTab("signup")}
            >
              Sign Up
            </button>
          </div>

          {/* Global Alert Messages */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2"
            >
              <svg
                className="w-5 h-5 flex-shrink-0 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 flex-shrink-0 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>{successMessage}</span>
              </div>
              {registeredId && (
                <div className="mt-2 p-3 bg-emerald-100/60 rounded-lg border border-emerald-300 select-all font-mono text-xs text-center break-all">
                  <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-emerald-800 mb-1">
                    Your Generated Worker ID
                  </div>
                  <strong className="text-emerald-950 font-bold">{registeredId}</strong>
                  <div className="text-[10px] font-sans text-emerald-700 mt-1">
                    Copy this ID and switch to the Sign In tab.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === "signin" && (
            <form onSubmit={handleSignInSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-semibold text-emerald-900 uppercase tracking-wider mb-1">
                  Worker ID
                </label>
                <input
                  type="text"
                  name="id"
                  placeholder="Enter your Worker ID"
                  aria-label="Worker ID"
                  value={signInForm.id}
                  onChange={handleSignInChange}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.id ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-emerald-500"
                  } bg-white/70 focus:outline-none focus:ring-2 text-sm text-gray-800 transition`}
                />
                {errors.id && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.id}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-900 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter Password"
                  aria-label="Password"
                  value={signInForm.password}
                  onChange={handleSignInChange}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.password ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-emerald-500"
                  } bg-white/70 focus:outline-none focus:ring-2 text-sm text-gray-800 transition`}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 text-white font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 rounded-xl transition duration-200 shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? "Signing In…" : "Sign In"}
              </button>

              <div className="pt-2 text-center text-xs text-emerald-800">
                Don't have a worker account?{" "}
                <button
                  type="button"
                  className="font-bold underline hover:text-emerald-900"
                  onClick={() => switchTab("signup")}
                >
                  Sign up here
                </button>
              </div>
            </form>
          )}

          {/* SIGN UP FORM */}
          {mode === "signup" && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-semibold text-emerald-900 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Dr. Jane Smith"
                  aria-label="Full Name"
                  value={signUpForm.name}
                  onChange={handleSignUpChange}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.name ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-emerald-500"
                  } bg-white/70 focus:outline-none focus:ring-2 text-sm text-gray-800 transition`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-900 uppercase tracking-wider mb-1">
                  Hospital ID
                </label>
                <input
                  type="text"
                  name="hospitalId"
                  placeholder="e.g. HOSP-NY-102"
                  aria-label="Hospital ID"
                  value={signUpForm.hospitalId}
                  onChange={handleSignUpChange}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.hospitalId ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-emerald-500"
                  } bg-white/70 focus:outline-none focus:ring-2 text-sm text-gray-800 transition`}
                />
                {errors.hospitalId && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.hospitalId}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-900 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="At least 6 characters"
                  aria-label="Create Password"
                  value={signUpForm.password}
                  onChange={handleSignUpChange}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.password ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-emerald-500"
                  } bg-white/70 focus:outline-none focus:ring-2 text-sm text-gray-800 transition`}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-900 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  aria-label="Confirm Password"
                  value={signUpForm.confirmPassword}
                  onChange={handleSignUpChange}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.confirmPassword ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-emerald-500"
                  } bg-white/70 focus:outline-none focus:ring-2 text-sm text-gray-800 transition`}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 text-white font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 rounded-xl transition duration-200 shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? "Registering…" : "Register & Generate ID"}
              </button>

              <div className="pt-2 text-center text-xs text-emerald-800">
                Already registered?{" "}
                <button
                  type="button"
                  className="font-bold underline hover:text-emerald-900"
                  onClick={() => switchTab("signin")}
                >
                  Sign In instead
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;