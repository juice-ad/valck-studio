import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn(email, password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      // Check role to redirect to correct dashboard
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentSession.user.id)
          .single();

        if (profileData?.role === "admin") {
          navigate("/admin");
          return;
        }
      }
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
          <h2 className="text-lg font-semibold text-text mb-4">Inloggen</h2>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-[8px] bg-[#fef2f2] border border-[#fecaca] text-[#ef4444] text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              Inloggen
            </button>
          </form>

          <p className="text-xs text-text-muted text-center mt-4">
            Nog geen account? Je hebt een uitnodigingslink nodig van Valck Studio.
          </p>
        </div>

        {/* Back link */}
        <p className="text-center mt-6">
          <Link
            to="/"
            className="text-sm text-text-muted hover:text-text no-underline transition-colors"
          >
            Terug naar website
          </Link>
        </p>
      </div>
    </div>
  );
}
