import { useEffect, useState } from "react";
import { FileText, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Document } from "@/types/portal";

export function Documenten() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("documents")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setDocuments((data as Document[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">Documenten</h1>

      {documents.length === 0 ? (
        <div className="rounded-[12px] bg-bg-white border border-border-light p-8 text-center">
          <p className="text-text-muted text-sm">
            Er zijn nog geen documenten beschikbaar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-[12px] bg-bg-white border border-border-light p-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-[8px] bg-accent-soft flex items-center justify-center shrink-0">
                  <FileText size={20} className="text-text-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text truncate">
                    {doc.name}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {new Date(doc.created_at).toLocaleDateString("nl-NL")}
                  </p>
                </div>
              </div>
              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text no-underline mt-3 transition-colors"
              >
                <Download size={14} />
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
