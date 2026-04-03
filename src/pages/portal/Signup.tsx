import { useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function Signup() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [tokenVerified, setTokenVerified] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Verify invite token on mount
  useEffect(() => {
    if (!token) {
      setTokenError("Geen invite token gevonden.");
      setVerifying(false);
      return;
    }

    async function verify() {
      const { data, error } = await supabase.rpc("verify_invite", {
        input_token: token!,
      });

      if (error) {
        setTokenError("Kon de uitnodiging niet verifiëren.");
        setVerifying(false);
        return;
      }

      if (!data?.success) {
        const messages: Record<string, string> = {
          invalid: "Deze uitnodigingslink is ongeldig.",
          used: "Deze uitnodiging is al gebruikt.",
          expired: "Deze uitnodiging is verlopen.",
        };
        setTokenError(messages[data?.code] ?? "Ongeldige uitnodiging.");
        setVerifying(false);
        return;
      }

      setTokenVerified(true);
      setClientId(data.client_id ?? null);
      setVerifying(false);
    }

    verify();
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!fullName.trim()) {
      setError("Vul je volledige naam in.");
      return;
    }
    if (password.length < 8) {
      setError("Wachtwoord moet minimaal 8 tekens zijn.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Wachtwoorden komen niet overeen.");
      return;
    }

    setLoading(true);

    // 1. Create Supabase Auth account
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (signUpError || !authData.user) {
      setError(signUpError?.message ?? "Account aanmaken mislukt.");
      setLoading(false);
      return;
    }

    // 2. Burn the invite
    const { data: burnData, error: burnError } = await supabase.rpc(
      "burn_invite",
      { input_token: token! }
    );

    if (burnError || !burnData?.success) {
      setError("Uitnodiging kon niet worden geactiveerd.");
      setLoading(false);
      return;
    }

    // 3. Create membership if client_id was on the invite
    if (clientId) {
      await supabase.from("user_client_memberships").insert({
        user_id: authData.user.id,
        client_id: clientId,
        is_default: true,
      });

      // Also set linked_client_id on profile
      await supabase
        .from("profiles")
        .update({ linked_client_id: clientId })
        .eq("id", authData.user.id);
    }

    setSuccess(true);
    setLoading(false);

    // Redirect to login after 2 seconds
    setTimeout(() => navigate("/portal/login"), 2000);
  }

  if (!tokenVerified && !verifying && !tokenError) {
    return null; // Should not happen
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin mx-auto mb-4" />
          <p className="text-sm text-text-secondary">
            Uitnodiging verifiëren...
          </p>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <AlertCircle size={40} className="text-[#ef4444] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-text mb-2">
            Uitnodiging ongeldig
          </h1>
          <p className="text-sm text-text-secondary mb-6">{tokenError}</p>
          <Link
            to="/portal/login"
            className="text-sm text-text font-medium no-underline hover:underline"
          >
            Naar inloggen
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <CheckCircle2 size={40} className="text-green mx-auto mb-4" />
          <h1 className="text-xl font-bold text-text mb-2">
            Account aangemaakt!
          </h1>
          <p className="text-sm text-text-secondary">
            Je wordt doorgestuurd naar de inlogpagina...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-bold text-2xl tracking-[-0.5px] text-text">
            valck
            <span className="font-light text-text-muted ml-1.5">studio</span>
          </h1>
          <p className="text-sm text-text-secondary mt-2">
            Maak je account aan om toegang te krijgen tot het klantportaal.
          </p>
        </div>

        <div className="rounded-[12px] bg-bg-white border border-border-light p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Registreren</h2>

          {error && (
            <div className="rounded-[8px] bg-[#fef2f2] border border-[#fecaca] px-4 py-3 mb-4">
              <p className="text-sm text-[#ef4444]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Volledige naam *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jan de Vries"
                required
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                E-mailadres *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jan@bedrijf.nl"
                required
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Wachtwoord *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimaal 8 tekens"
                required
                minLength={8}
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Wachtwoord bevestigen *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Herhaal je wachtwoord"
                required
                className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-text text-white rounded-[8px] px-4 py-2.5 text-sm font-semibold hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Account aanmaken
            </button>
          </form>

          <p className="text-xs text-text-muted text-center mt-4">
            Al een account?{" "}
            <Link
              to="/portal/login"
              className="text-text font-medium no-underline hover:underline"
            >
              Inloggen
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
