import { Clock, Building2, Wrench, AlertTriangle, TrendingUp, Target, Palette } from "lucide-react";

const sections = [
  { icon: Building2, label: "Jouw bedrijf", description: "Wie ben je en wat doe je?" },
  { icon: Wrench, label: "Werkwijze & tools", description: "Hoe werk je nu?" },
  { icon: AlertTriangle, label: "Pijnpunten", description: "Waar loop je tegenaan?" },
  { icon: TrendingUp, label: "Groei", description: "Waar wil je naartoe?" },
  { icon: Target, label: "Prioriteiten", description: "Wat is het belangrijkst?" },
  { icon: Palette, label: "Inspiratie", description: "Heb je al ideeën? (optioneel)" },
];

export function StepWelcome() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-text mb-2">
        Welkom bij de Valck Studio intake
      </h2>
      <p className="text-sm text-text-secondary mb-6">
        Met deze vragenlijst leren we je bedrijf, werkwijze en ambities kennen.
        Zo kunnen we een voorstel maken dat écht aansluit bij wat je nodig hebt.
      </p>

      <div className="flex items-center gap-2 mb-6 text-sm text-text-muted">
        <Clock size={16} />
        <span>Duurt ongeveer 10 minuten</span>
      </div>

      <div className="flex flex-col gap-3">
        {sections.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 p-3 rounded-[8px] bg-accent-soft/50"
          >
            <s.icon size={18} className="text-text-muted shrink-0" />
            <div>
              <p className="text-sm font-medium text-text">{s.label}</p>
              <p className="text-xs text-text-muted">{s.description}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-text-muted mt-6">
        Je antwoorden worden automatisch opgeslagen. Je kunt altijd stoppen en later verder gaan.
      </p>
    </div>
  );
}
