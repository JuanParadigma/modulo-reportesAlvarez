'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { Sucursal } from '@/lib/queries/ventas';

interface Props {
  sucursales:     Sucursal[];
  fechaDesde:     string;
  fechaHasta:     string;
  sucursalActual?: string;
  // Comparación
  fechaDesde2?:   string;
  fechaHasta2?:   string;
}

export function VentasFiltros({
  sucursales,
  fechaDesde,
  fechaHasta,
  sucursalActual,
  fechaDesde2,
  fechaHasta2,
}: Props) {
  const router    = useRouter();
  const pathname  = usePathname();
  const [comparar, setComparar] = useState(!!(fechaDesde2 && fechaHasta2));

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;

    const get = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement)?.value ?? '';

    const params = new URLSearchParams({
      desde: get('desde'),
      hasta: get('hasta'),
    });

    const suc = get('sucursal');
    if (suc) params.set('sucursal', suc);

    if (comparar) {
      params.set('desde2', get('desde2'));
      params.set('hasta2', get('hasta2'));
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  function handleQuitarComparacion() {
    setComparar(false);
    // Limpiar params de comparación de la URL inmediatamente
    const params = new URLSearchParams({
      desde: fechaDesde,
      hasta: fechaHasta,
    });
    if (sucursalActual) params.set('sucursal', sucursalActual);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4"
    >
      {/* Período A */}
      <div className="flex flex-wrap gap-4 items-end">

        {comparar && (
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide
                           self-center bg-blue-500/10 px-2 py-1 rounded">
            Período A
          </span>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Desde
          </label>
          <input
            name="desde"
            type="date"
            defaultValue={fechaDesde}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2
                       text-sm text-slate-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Hasta
          </label>
          <input
            name="hasta"
            type="date"
            defaultValue={fechaHasta}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2
                       text-sm text-slate-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Sucursal
          </label>
          <select
            name="sucursal"
            defaultValue={sucursalActual ?? ''}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2
                       text-sm text-slate-100 min-w-52
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las sucursales</option>
            {sucursales.map(s => (
              <option key={s.Codigo} value={s.Codigo}>
                {s.Nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 ml-auto">
          {!comparar ? (
            <button
              type="button"
              onClick={() => setComparar(true)}
              className="text-sm text-slate-400 border border-slate-700
                         hover:text-white hover:border-slate-500
                         px-4 py-2 rounded-lg transition-colors"
            >
              + Comparar períodos
            </button>
          ) : (
            <button
              type="button"
              onClick={handleQuitarComparacion}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Quitar comparación
            </button>
          )}

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold
                       px-5 py-2 rounded-lg transition-colors"
          >
            Aplicar
          </button>
        </div>
      </div>

      {/* Período B — solo visible en modo comparación */}
      {comparar && (
        <div className="flex flex-wrap gap-4 items-end pt-3
                        border-t border-slate-800">

          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide
                           self-center bg-emerald-500/10 px-2 py-1 rounded">
            Período B
          </span>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Desde
            </label>
            <input
              name="desde2"
              type="date"
              defaultValue={fechaDesde2 ?? fechaDesde}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2
                         text-sm text-slate-100
                         focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Hasta
            </label>
            <input
              name="hasta2"
              type="date"
              defaultValue={fechaHasta2 ?? fechaHasta}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2
                         text-sm text-slate-100
                         focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <p className="text-xs text-slate-500 self-center">
            La sucursal se aplica a ambos períodos
          </p>
        </div>
      )}
    </form>
  );
}