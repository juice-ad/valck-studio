import { Link } from "react-router-dom";

const studioLinks = [
  { label: "Werkwijze", to: "/werkwijze" },
  { label: "Portfolio", to: "/portfolio" },
  { label: "Prijzen", to: "/prijzen" },
  { label: "Contact", href: "#contact" },
];

const legalLinks = [
  { label: "Algemene voorwaarden", to: "/voorwaarden" },
  { label: "Privacybeleid", to: "/privacy" },
  { label: "Verwerkersovereenkomst", to: "/verwerkersovereenkomst" },
];

export function Footer() {
  return (
    <footer className="py-12 px-8 border-t border-border-light bg-bg-white">
      <div className="max-w-[1120px] mx-auto flex justify-between items-start flex-wrap gap-8 max-md:flex-col">
        {/* Brand */}
        <div>
          <Link
            to="/"
            className="font-bold text-lg tracking-[-0.5px] text-text no-underline"
          >
            valck
            <span className="font-light text-text-muted ml-1.5">studio</span>
          </Link>
          <p className="text-[13px] text-text-muted mt-2 max-w-[280px] leading-relaxed">
            Solo product studio voor founders die serieus willen bouwen.
            Gevestigd in Nederland, werkend voor heel Europa.
          </p>
        </div>

        {/* Links */}
        <div className="flex gap-12 max-md:flex-col max-md:gap-6">
          <div>
            <h4 className="text-xs font-semibold tracking-[0.3px] text-text-muted mb-3">
              Studio
            </h4>
            {studioLinks.map((link) =>
              link.to ? (
                <Link
                  key={link.label}
                  to={link.to}
                  className="block text-sm text-text-secondary no-underline py-0.5 hover:text-text transition-colors"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="block text-sm text-text-secondary no-underline py-0.5 hover:text-text transition-colors"
                >
                  {link.label}
                </a>
              )
            )}
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-[0.3px] text-text-muted mb-3">
              Juridisch
            </h4>
            {legalLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block text-sm text-text-secondary no-underline py-0.5 hover:text-text transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-[1120px] mx-auto mt-8 pt-6 border-t border-border-light flex justify-between items-center text-[13px] text-text-muted max-md:flex-col max-md:gap-2">
        <span>© 2026 Valck Studio. Alle rechten voorbehouden.</span>
        <span>KvK: [nummer] · BTW: [nummer]</span>
      </div>
    </footer>
  );
}
