"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Images, Upload, HardDrive, Activity, KeyRound } from "lucide-react";
import { cn } from "@/utils/cn";
import { usePreferencesStore } from "@/store/preferences-store";

const NAV_ITEMS = [
  { href: "/gallery", label: "Galeria", icon: Images },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/nodes", label: "Nos", icon: HardDrive },
  { href: "/health", label: "Saude", icon: Activity },
  { href: "/recovery", label: "Recovery", icon: KeyRound },
];

export function Sidebar() {
  const pathname = usePathname();
  // Default to false on server, reads from localStorage after hydration
  const collapsed = usePreferencesStore((s) => s.sidebarCollapsed);

  return (
    <aside
      className={cn(
        "shrink-0 border-r border-border bg-surface flex flex-col transition-all",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className="p-4 border-b border-border">
        <h1 className={cn("font-bold text-text", collapsed ? "text-sm text-center" : "text-xl")}>
          {collapsed ? "A" : "Alexandria"}
        </h1>
        {!collapsed && (
          <p className="text-xs text-text-muted mt-1">Armazenamento Familiar</p>
        )}
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                collapsed && "justify-center",
                active
                  ? "bg-[#EFF6FF] text-primary font-medium"
                  : "text-text-muted hover:bg-surface hover:text-text",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
