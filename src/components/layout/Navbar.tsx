import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Werkwijze", to: "/werkwijze" },
  { label: "Portfolio", to: "/portfolio" },
  { label: "Integraties", to: "/integraties" },
  { label: "Prijzen", to: "/prijzen" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { session, profile, user, signOut } = useAuth();

  const displayName = profile?.full_name || user?.email || "";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [dropdownOpen]);

  async function handleSignOut() {
    await signOut();
    setDropdownOpen(false);
    setMobileOpen(false);
    navigate("/");
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-bg/85 backdrop-blur-xl border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1120px] mx-auto px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link
          to="/"
          className="font-bold text-lg tracking-[-0.5px] text-text no-underline"
        >
          valck
          <span className="font-light text-text-muted ml-1.5">studio</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`no-underline text-sm transition-colors ${
                pathname === link.to
                  ? "text-text font-semibold"
                  : "text-text-secondary font-[450] hover:text-text"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {session ? (
            /* Ingelogd: avatar dropdown */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-8 h-8 rounded-full bg-text text-white text-xs font-semibold flex items-center justify-center hover:bg-[#333] transition-colors"
              >
                {initials}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-11 bg-bg-white rounded-[12px] border border-border-light shadow-lg py-2 min-w-[160px]">
                  {profile?.is_admin && (
                    <Link
                      to="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-text hover:bg-accent-soft no-underline transition-colors"
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    to="/portal/project"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-text hover:bg-accent-soft no-underline transition-colors"
                  >
                    Portaal
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-accent-soft hover:text-text transition-colors"
                  >
                    Uitloggen
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Uitgelogd: portaal link + CTA */
            <>
              <Link
                to="/portal/login"
                className="no-underline text-sm text-text-secondary font-[450] hover:text-text transition-colors"
              >
                Portaal
              </Link>
              <a
                href="#contact"
                className="bg-text text-white px-5 py-2 rounded-lg text-[13px] font-[550] no-underline hover:bg-[#333] transition-all hover:-translate-y-0.5"
              >
                Start een project →
              </a>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-text"
          aria-label="Menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-bg-white border-b border-border px-8 pb-6 pt-2"
        >
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`no-underline text-sm transition-colors ${
                  pathname === link.to
                    ? "text-text font-semibold"
                    : "text-text-secondary font-[450] hover:text-text"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {session ? (
              <>
                <Link
                  to="/portal/project"
                  onClick={() => setMobileOpen(false)}
                  className="no-underline text-sm text-text-secondary font-[450] hover:text-text transition-colors"
                >
                  Portaal
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-left text-sm text-text-secondary font-[450] hover:text-text transition-colors"
                >
                  Uitloggen
                </button>
              </>
            ) : (
              <Link
                to="/portal/login"
                onClick={() => setMobileOpen(false)}
                className="no-underline text-sm text-text-secondary font-[450] hover:text-text transition-colors"
              >
                Portaal
              </Link>
            )}

            <a
              href="#contact"
              onClick={() => setMobileOpen(false)}
              className="bg-text text-white px-5 py-3 rounded-lg text-sm font-semibold no-underline text-center hover:bg-[#333] transition-all"
            >
              Start een project →
            </a>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
