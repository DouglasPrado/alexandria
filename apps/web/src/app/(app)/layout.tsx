'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Images, HardDrive, Bell, Users, Settings, LogOut } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Galeria', icon: Images },
  { href: '/dashboard/nodes', label: 'Nos', icon: HardDrive },
  { href: '/dashboard/alerts', label: 'Alertas', icon: Bell },
  { href: '/dashboard/members', label: 'Membros', icon: Users },
  { href: '/dashboard/settings', label: 'Configuracoes', icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const member = useAuthStore((s) => s.member);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      <aside className="w-60 bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] flex flex-col">
        <div className="p-5 border-b border-[var(--sidebar-border)]">
          <h1 className="text-lg font-bold text-[var(--sidebar-foreground)]">Alexandria</h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">{member?.name || 'Membro'}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
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
