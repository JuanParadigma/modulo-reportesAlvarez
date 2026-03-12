import Link from 'next/link';
import { NavItem } from '@/components/NavItem';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

const navItems = [
  {
    label: 'Ventas',
    children: [
      { label: 'Ventas x Vendedor', href: '/reportes/ventas' },
      { label: 'Artículos + Vendidos', href: '/reportes/articulos' },
    ],
  },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">

          {/* Logo + Nav */}
          <div className="flex items-center gap-8">
            <Link href={'/dashboard'} >
              <span className="font-bold text-white text-sm tracking-wide">
                ALVAREZ reportes
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map(item => (
                <NavItem key={item.label} item={item} />
              ))}
            </nav>
          </div>

          {/* Usuario */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">
              {session.user?.name}
            </span>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Salir
              </button>
            </form>
          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
}