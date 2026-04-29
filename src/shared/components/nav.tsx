'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/onboarding', label: 'Onboarding' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/scout', label: 'Scout' },
  { href: '/pathfinder', label: 'Pathfinder' },
  { href: '/profile', label: 'Profile' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-semibold text-stone-900">Trailmark</span>
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname?.startsWith(item.href)
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
