'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LayoutDashboard, Calendar, Images, BookOpen, LogOut, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { name: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Events', href: '/admin/events', icon: Calendar },
  { name: 'Gallery', href: '/admin/gallery', icon: Images },
  { name: 'Magazine', href: '/admin/magazine', icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="flex h-full flex-col border-r border-rule bg-void-1">
      <Link
        href="/admin/dashboard"
        className="flex h-16 shrink-0 items-center gap-3 border-b border-rule px-5"
      >
        <span className="relative block h-8 w-8 shrink-0">
          <Image src="/images/astro_logo.png" alt="" fill sizes="32px" className="object-contain" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[0.9375rem] font-medium leading-tight text-starlight">
            Club admin
          </span>
          <span className="label-chart mt-0.5 block text-[0.5625rem]">J&apos;pura Astronomy</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex items-center gap-3 rounded-sm px-3 py-2.5 text-[0.9375rem] transition-colors duration-300',
                active
                  ? 'bg-azure/14 text-starlight'
                  : 'text-star-faint hover:bg-white/[0.045] hover:text-star-dim'
              )}
            >
              {active && (
                <span aria-hidden className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-azure-lit" />
              )}
              <item.icon className="h-[1.125rem] w-[1.125rem] shrink-0" strokeWidth={1.7} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-rule p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-[0.9375rem] text-star-faint transition-colors duration-300 hover:bg-white/[0.045] hover:text-star-dim"
        >
          <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={1.7} />
          View site
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-[0.9375rem] text-star-faint transition-colors duration-300 hover:bg-white/[0.045] hover:text-star-dim"
        >
          <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.7} />
          Sign out
        </button>
      </div>
    </div>
  );
}
