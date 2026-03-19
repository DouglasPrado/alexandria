"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/gallery", label: "Galeria", icon: "🖼" },
  { href: "/upload", label: "Upload", icon: "📤" },
  { href: "/nodes", label: "Nos", icon: "💾" },
  { href: "/health", label: "Saude", icon: "🩺" },
  { href: "/recovery", label: "Recovery", icon: "🔑" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-surface">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border bg-white flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold text-text">Alexandria</h1>
          <p className="text-xs text-text-muted mt-1">Armazenamento Familiar</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-text-muted hover:bg-surface hover:text-text"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
