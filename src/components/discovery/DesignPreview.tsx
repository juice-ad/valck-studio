/**
 * Live design preview mockup that renders a mini dashboard
 * using the client's chosen accent color and optional logo.
 */

interface Props {
  accentColor: string;
  logoUrl?: string | null;
}

export function DesignPreview({ accentColor, logoUrl }: Props) {
  const color = accentColor || "#111111";

  return (
    <div className="rounded-[12px] border border-border-light overflow-hidden bg-[#fafafa] shadow-sm">
      <div className="flex h-[320px]">
        {/* Sidebar */}
        <div className="w-44 bg-white border-r border-[#e5e5e5] flex flex-col p-3 shrink-0">
          {/* Logo */}
          <div className="h-8 mb-4 flex items-center gap-2">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-6 w-auto object-contain"
              />
            ) : (
              <div
                className="h-5 w-16 rounded"
                style={{ backgroundColor: color, opacity: 0.8 }}
              />
            )}
          </div>

          {/* Nav items */}
          <div className="flex flex-col gap-1">
            <div
              className="h-7 rounded-[6px] px-2 flex items-center text-[10px] font-medium text-white"
              style={{ backgroundColor: color }}
            >
              Dashboard
            </div>
            {["Projecten", "Berichten", "Documenten", "Facturen"].map(
              (item) => (
                <div
                  key={item}
                  className="h-7 rounded-[6px] px-2 flex items-center text-[10px] text-[#555]"
                >
                  {item}
                </div>
              )
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-24 rounded bg-[#111] opacity-80" />
            <div
              className="h-6 w-16 rounded-[6px] text-[9px] font-medium text-white flex items-center justify-center"
              style={{ backgroundColor: color }}
            >
              Nieuw
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: "Actief", value: "3" },
              { label: "Berichten", value: "12" },
              { label: "Facturen", value: "2" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-[8px] border border-[#e5e5e5] p-2.5"
              >
                <p className="text-[9px] text-[#888] mb-0.5">{stat.label}</p>
                <p className="text-base font-bold text-[#111]">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-[8px] border border-[#e5e5e5] overflow-hidden">
            <div className="flex gap-4 px-3 py-2 border-b border-[#e5e5e5]">
              <span className="text-[9px] font-semibold text-[#888] uppercase w-24">
                Project
              </span>
              <span className="text-[9px] font-semibold text-[#888] uppercase w-16">
                Status
              </span>
              <span className="text-[9px] font-semibold text-[#888] uppercase flex-1">
                Fase
              </span>
            </div>
            {["Platform redesign", "CRM module", "Integratie API"].map(
              (name, i) => (
                <div
                  key={name}
                  className="flex gap-4 px-3 py-2 border-b border-[#f0f0f0] last:border-b-0"
                >
                  <span className="text-[10px] font-medium text-[#111] w-24 truncate">
                    {name}
                  </span>
                  <span
                    className="text-[9px] font-medium px-1.5 py-0.5 rounded-full text-white w-16 text-center"
                    style={{
                      backgroundColor: i === 0 ? color : i === 1 ? "#10b981" : "#3b82f6",
                    }}
                  >
                    {i === 0 ? "Actief" : i === 1 ? "Klaar" : "Review"}
                  </span>
                  <span className="text-[10px] text-[#555] flex-1">
                    {i === 0 ? "Build" : i === 1 ? "Completed" : "Discovery"}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
