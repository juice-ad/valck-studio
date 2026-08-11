import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  Sparkles,
  FileText,
  Receipt,
  Search,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, shortcut: "D" },
  { label: "Organisaties", path: "/admin/clients", icon: Building2, shortcut: "C" },
  { label: "Gebruikers", path: "/admin/users", icon: Users, shortcut: "U" },
  { label: "Projecten", path: "/admin/projecten", icon: FolderKanban, shortcut: "P" },
  { label: "Intakes", path: "/admin/briefs", icon: Sparkles, shortcut: "I" },
  { label: "Documenten", path: "/admin/documenten", icon: FileText },
  { label: "Facturen", path: "/admin/facturen", icon: Receipt, shortcut: "F" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      // Single-key shortcuts (only when no input is focused)
      if (
        !open &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        document.activeElement?.tagName !== "SELECT"
      ) {
        const item = navItems.find(
          (n) => n.shortcut?.toLowerCase() === e.key.toLowerCase()
        );
        if (item) {
          e.preventDefault();
          navigate(item.path);
        }
      }
    },
    [open, navigate]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  function handleSelect(path: string) {
    setOpen(false);
    navigate(path);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Zoek pagina of actie..." />
      <CommandList>
        <CommandEmpty>Geen resultaten gevonden.</CommandEmpty>
        <CommandGroup heading="Navigatie">
          {navItems.map((item) => (
            <CommandItem
              key={item.path}
              onSelect={() => handleSelect(item.path)}
            >
              <item.icon size={16} className="mr-2 text-text-muted" />
              <span>{item.label}</span>
              {item.shortcut && (
                <kbd className="ml-auto text-xs bg-accent-soft text-text-muted px-1.5 py-0.5 rounded font-mono">
                  {item.shortcut}
                </kbd>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Acties">
          <CommandItem onSelect={() => handleSelect("/admin/facturen")}>
            <Receipt size={16} className="mr-2 text-text-muted" />
            <span>Nieuwe factuur aanmaken</span>
            <kbd className="ml-auto text-xs bg-accent-soft text-text-muted px-1.5 py-0.5 rounded font-mono">
              N
            </kbd>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/admin/clients")}>
            <Building2 size={16} className="mr-2 text-text-muted" />
            <span>Nieuwe organisatie aanmaken</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/admin/projecten")}>
            <FolderKanban size={16} className="mr-2 text-text-muted" />
            <span>Nieuw project aanmaken</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
      <div className="border-t border-border-light px-3 py-2 text-xs text-text-muted flex items-center gap-3">
        <span className="inline-flex items-center gap-1">
          <kbd className="bg-accent-soft px-1 py-0.5 rounded font-mono">↑↓</kbd> navigeer
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="bg-accent-soft px-1 py-0.5 rounded font-mono">↵</kbd> open
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="bg-accent-soft px-1 py-0.5 rounded font-mono">esc</kbd> sluit
        </span>
      </div>
    </CommandDialog>
  );
}

export function CommandPaletteTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-[8px] border border-border-light text-xs text-text-muted hover:bg-accent-soft transition-colors"
    >
      <Search size={14} />
      <span>Zoeken...</span>
      <kbd className="bg-accent-soft px-1.5 py-0.5 rounded font-mono text-[10px]">
        ⌘K
      </kbd>
    </button>
  );
}
