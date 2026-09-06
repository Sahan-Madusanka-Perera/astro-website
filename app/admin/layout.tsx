'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Sidebar } from '@/components/admin/Sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex h-[100svh] bg-void text-star-dim">
        {/* Desktop rail */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <Sidebar />
        </aside>

        {/* Mobile drawer */}
        {open && (
          <>
            <div
              className="fixed inset-0 z-40 bg-void/80 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
              <Sidebar />
            </aside>
          </>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-rule px-4 lg:hidden">
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close navigation' : 'Open navigation'}
              aria-expanded={open}
              className="grid h-10 w-10 place-items-center rounded-sm text-starlight transition-colors hover:bg-white/[0.06]"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <span className="text-[0.9375rem] font-medium text-starlight">Club admin</span>
          </header>

          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[76rem] px-5 py-8 md:px-8 md:py-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
