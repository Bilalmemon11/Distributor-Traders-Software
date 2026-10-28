import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Login() {
  const { login, token } = useApp();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      navigate("/");
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter your username/email and password.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await login(username.trim(), password);
    setLoading(false);

    if (res.success) {
      navigate("/");
    } else {
      setError(res.message || "Invalid login credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Brand Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl mb-4 text-4xl">
            🚚
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide">
            QADRI DISTRIBUTOR
          </h1>
          <p className="text-blue-200/80 text-xs md:text-sm mt-1 font-medium">
            Trading & Distribution Management ERP
          </p>
        </div>

        {/* Login Form Container */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your email and password to access your dashboard.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-200">
              <span className="text-base leading-none">⚠️</span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username / Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Username / Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                  👤
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username or email"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                  🔑
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? "🙈 Hide" : "👁️ Show"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#1e3a8a]/25 transition duration-150 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Branding */}
          <div className="mt-8 pt-5 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-medium">
              Software Created by StackNova-Tech: +923-373375526
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
