import type { Branch } from "@/lib/intake-branches";

interface Props {
  branches: Branch[];
  responses: Record<string, string>;
  onChange: (id: string, value: string) => void;
}

export function BranchQuestions({ branches, responses, onChange }: Props) {
  if (branches.length === 0) return null;

  return (
    <div className="space-y-6 mt-6 pt-6 border-t border-border-light">
      {branches.map((branch) => (
        <div key={branch.type}>
          <h3 className="text-sm font-semibold text-text mb-3">
            {branch.label}
          </h3>
          <div className="space-y-4">
            {branch.questions.map((q) => (
              <div key={q.id}>
                <label className="block text-sm text-text-secondary mb-1.5">
                  {q.label}
                </label>
                {q.type === "text" && (
                  <input
                    type="text"
                    value={responses[q.id] ?? ""}
                    onChange={(e) => onChange(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm"
                  />
                )}
                {q.type === "textarea" && (
                  <textarea
                    value={responses[q.id] ?? ""}
                    onChange={(e) => onChange(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    rows={3}
                    className="w-full rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm resize-none"
                  />
                )}
                {q.type === "select" && q.options && (
                  <select
                    value={responses[q.id] ?? ""}
                    onChange={(e) => onChange(q.id, e.target.value)}
                    className="rounded-[8px] border border-border-light bg-bg px-3 py-2.5 text-sm"
                  >
                    <option value="">Selecteer...</option>
                    {q.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
