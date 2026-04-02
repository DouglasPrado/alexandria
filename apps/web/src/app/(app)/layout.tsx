'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import {
  LayoutGrid,
  Search,
  Network,
  Bell,
  Users,
  Server,
  User,
  Plus,
  HelpCircle,
  Settings,
  LogOut,
} from 'lucide-react';

/**
 * Shell + Sidebar — Alexandria Protocol (Stitch design)
 * Sidebar: light bg, Manrope bold tracking-tight, Material Icons style
 * Top bar: glassmorphism (bg-white/80 backdrop-blur), tabs, avatar
 * Active nav: bold text + right border stripe + subtle bg
 */

const navItems = [
  { href: '/dashboard', label: 'Galeria', icon: LayoutGrid },
  { href: '/dashboard/search', label: 'Busca', icon: Search },
  { href: '/dashboard/nodes', label: 'Nós', icon: Network },
  { href: '/dashboard/alerts', label: 'Alertas', icon: Bell, adminOnly: true },
  { href: '/dashboard/members', label: 'Membros', icon: Users, adminOnly: true },
  { href: '/dashboard/cluster', label: 'Cluster', icon: Server, adminOnly: true },
  { href: '/dashboard/settings', label: 'Minha Conta', icon: User },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const member = useAuthStore((s) => s.member);
  const isAdmin = member?.role === 'admin';

  const visibleItems = navItems.filter(
    (item) => !('adminOnly' in item && item.adminOnly) || isAdmin,
  );

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--surface)' }}>
      {/* Sidebar — light, Stitch design */}
      <aside
        className="w-64 h-screen fixed left-0 top-0 flex flex-col z-50"
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
        }}
      >
        {/* Logo */}
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center rounded-lg shadow-sm"
              style={{ backgroundColor: 'var(--primary-container)' }}
            >
              <Server size={20} className="text-white" />
            </div>
            <div>
              <h1
                className="text-2xl font-bold tracking-tighter font-display"
                style={{ color: 'var(--sidebar-foreground)' }}
              >
                Alexandria
              </h1>
              <p
                className="text-[10px] uppercase tracking-widest font-bold"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Node Cluster
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                  active
                    ? 'font-bold border-r-2'
                    : 'hover:bg-[var(--sidebar-active-bg)]'
                }`}
                style={
                  active
                    ? {
                        color: 'var(--sidebar-active-text)',
                        borderRightColor: 'var(--sidebar-active-stripe)',
                        backgroundColor: 'var(--sidebar-active-bg)',
                      }
                    : { color: 'var(--sidebar-muted)' }
                }
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer: Add Node button */}
        <div className="p-4 mt-auto">
          <button
            onClick={() => router.push('/dashboard/nodes')}
            className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--primary-container)' }}
          >
            <Plus size={16} />
            Novo Nó
          </button>
        </div>
      </aside>

      {/* Right side */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        {/* Top bar — glassmorphism */}
        <header
          className="h-16 fixed top-0 right-0 z-40 flex justify-between items-center px-8"
          style={{
            width: 'calc(100% - 16rem)',
            backgroundColor: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--sidebar-border)',
          }}
        >
          {/* Left: logo + tabs */}
          <div className="flex items-center gap-8">
            <span
              className="text-lg font-black font-display"
              style={{ color: 'var(--foreground)' }}
            >
              Alexandria
            </span>
            <div className="flex gap-6">
              <Link
                href="/dashboard/cluster"
                className="text-sm font-display pb-1"
                style={
                  pathname.includes('/cluster')
                    ? {
                        color: 'var(--sidebar-active-text)',
                        borderBottom: '2px solid var(--sidebar-active-text)',
                        fontWeight: 700,
                      }
                    : { color: 'var(--sidebar-muted)' }
                }
              >
                Dashboard
              </Link>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-4">
            <div className="flex gap-2 mr-4">
              <button
                className="p-2 rounded-full transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <HelpCircle size={20} />
              </button>
              <button
                className="p-2 rounded-full transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <Settings size={20} />
              </button>
            </div>
            <button
              className="px-4 py-1.5 text-sm font-bold rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--surface-container-highest)',
                color: 'var(--primary-container)',
              }}
            >
              Invite
            </button>
            <button
              className="px-4 py-1.5 text-sm font-bold rounded-lg text-white transition-transform hover:scale-95"
              style={{ backgroundColor: 'var(--primary-container)' }}
            >
              Upload
            </button>
            {/* Avatar + Dropdown */}
            <AvatarDropdown member={member} />
          </div>
        </header>

        {/* Main content */}
        <main className="pt-24 px-10 pb-12 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}

function AvatarDropdown({ member }: { member: { name: string; email: string; role: string } | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const initials = member?.name
    ? member.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const handleClose = useCallback(() => setOpen(false), []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, handleClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, handleClose]);

  return (
    <div ref={ref} className="relative ml-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:ring-2 hover:ring-[var(--surface-tint)]"
        style={{
          backgroundColor: 'var(--surface-container-highest)',
          color: 'var(--primary-container)',
        }}
        aria-label="Menu do perfil"
        aria-expanded={open}
      >
        {initials}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden z-50"
          style={{
            backgroundColor: 'var(--surface-container-lowest)',
            boxShadow: '0px 16px 48px rgba(19, 27, 46, 0.12)',
          }}
        >
          {/* User info */}
          <div className="px-4 py-3" style={{ backgroundColor: 'var(--surface-container-low)' }}>
            <p className="text-sm font-display font-bold truncate" style={{ color: 'var(--foreground)' }}>
              {member?.name ?? 'Membro'}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
              {member?.email}
            </p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => {
                handleClose();
                router.push('/dashboard/settings');
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left"
              style={{ color: 'var(--foreground)' }}
            >
              <User size={16} style={{ color: 'var(--muted-foreground)' }} />
              Minha Conta
            </button>
            <button
              onClick={() => {
                handleClose();
                logout();
                window.location.href = '/login';
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left"
              style={{ color: 'var(--destructive)' }}
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
