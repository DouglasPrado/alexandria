'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Images, Search, HardDrive, Bell, Users, Settings, User, LogOut } from 'lucide-react';

/**
 * Sidebar navigation items.
 * Fonte: docs/frontend/web/07-routes.md (Itens da Sidebar)
 * adminOnly: visível apenas para role admin
 */
const navItems = [
  { href: '/dashboard', label: 'Galeria', icon: Images, adminOnly: false },
  { href: '/dashboard/search', label: 'Busca', icon: Search, adminOnly: false },
  { href: '/dashboard/nodes', label: 'Nós', icon: HardDrive, adminOnly: true },
  { href: '/dashboard/alerts', label: 'Alertas', icon: Bell, adminOnly: true },
  { href: '/dashboard/members', label: 'Membros', icon: Users, adminOnly: true },
  { href: '/dashboard/cluster', label: 'Cluster', icon: Settings, adminOnly: true },
  { href: '/dashboard/settings', label: 'Minha Conta', icon: User, adminOnly: false },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const member = useAuthStore((s) => s.member);
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = member?.role === 'admin';

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      <aside className="w-60 bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] flex flex-col">
        <div className="p-5 border-b border-[var(--sidebar-border)]">
          <h1 className="text-lg font-bold text-[var(--sidebar-foreground)]">Alexandria</h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">{member?.name || 'Membro'}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-[var(--radius)] text-sm transition-colors ${
                  isActive
                    ? 'bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)] font-medium'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[var(--sidebar-border)]">
          <button
            onClick={() => { logout(); window.location.href = '/login'; }}
            className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
