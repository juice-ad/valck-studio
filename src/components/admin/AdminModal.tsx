import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export function AdminModal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}: AdminModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div className={`relative w-full ${maxWidth} rounded-[12px] bg-bg-white border border-border-light p-6 shadow-xl`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-[6px] text-text-muted hover:text-text hover:bg-accent-soft transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
