'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavChild {
  label: string;
  href:  string;
}

interface NavItemType {
  label:    string;
  children: NavChild[];
}

export function NavItem({ item }: { item: NavItemType }) {
  const [open, setOpen]     = useState(false);
  const ref                 = useRef<HTMLDivElement>(null);
  const pathname            = usePathname();
  const isActive            = item.children.some(c => pathname.startsWith(c.href));

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
        transition-colors duration-150
        ${isActive
        ? 'text-white bg-slate-800'
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
      >
        {item.label}
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-52
          bg-slate-900 border border-slate-800 rounded-xl
          shadow-xl shadow-black/40 overflow-hidden z-50">
          {item.children.map(child => (
            <Link
              key={child.href}
              href={child.href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2.5 text-sm transition-colors
              ${pathname.startsWith(child.href)
              ? 'text-white bg-slate-800'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}