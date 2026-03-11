import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Ventas', href: '/reportes/ventas' },
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

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">

          {/* Logo + Nav */}
          <div className="flex items-center gap-8">
            <span className="font-bold text-white text-sm tracking-wide">
              SIGE Reportes
            </span>
            <nav className="flex items-center gap-1">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 rounded-lg text-sm text-slate-400
                             hover:text-white hover:bg-slate-800
                             transition-colors duration-150"
                >
                  {item.label}
                </Link>
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

      {/* Contenido */}
      <main className="max-w-screen-xl mx-auto px-6 py-6">
        {children}
      </main>

    </div>
  );
}