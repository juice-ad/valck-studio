import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result =
      mode === "login"
        ? await signIn(email, password)
        : await signUp(email, password, fullName, company);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      navigate("/portal/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <Link
          to="/"
          className="block text-center font-bold text-xl tracking-[-0.5px] text-text no-underline mb-8"
        >
          valck
          <span className="font-light text-text-muted ml-1.5">studio</span>
        </Link>

        {/* Card */}
        <div className="bg-bg-white rounded-[12px] border border-border-light p-6">
          {/* Tab toggle */}
          <div className="flex rounded-[8px] bg-accent-soft p-1 mb-6">
            <button
              onClick={() => { setMode("login"); setError(null); }}
              className={`flex-1 py-2 text-sm rounded-[6px] font-medium transition-colors ${
                mode === "login"
                  ? "bg-bg-white text-text shadow-xs"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              Inloggen
            </button>
            <button
              onClick={() => { setMode("register"); setError(null); }}
              className={`flex-1 py-2 text-sm rounded-[6px] font-medium transition-colors ${
                mode === "register"
                  ? "bg-bg-white text-text shadow-xs"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              Registreren
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-[8px] bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    Naam
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Je volledige naam"
                    className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    Bedrijfsnaam
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Naam van je bedrijf"
                    className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                E-mailadres
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="je@bedrijf.nl"
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Wachtwoord
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-text text-white rounded-[8px] py-2.5 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              )}
              {mode === "login" ? "Inloggen" : "Account aanmaken"}
            </button>
          </form>
        </div>

        {/* Back link */}
        <p className="text-center mt-6">
          <Link
            to="/"
            className="text-sm text-text-muted hover:text-text no-underline transition-colors"
          >
            ← Terug naar website
          </Link>
        </p>
      </div>
    </div>
  );
}
