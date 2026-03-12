'use client';

import { useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { Sucursal, Linea, Grupo, Rubro } from '@/lib/queries/ventas';

interface Props {
  sucursales: Sucursal[];
  lineas: Linea[];
  grupos: Grupo[];
  rubros: Rubro[];  
  fechaDesde: string;
  fechaHasta: string;
  sucursalActual?: string;
  lineaActual?: string;
  grupoActual?: string;
  rubroActual?: string;
  fechaDesde2?: string;
  fechaHasta2?: string;
}

interface SelectProps {
  label: string;
  name: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}

function Select({ label, name, defaultValue, onChange, options, placeholder }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
        {label}
      </label>
      <select
        name={name}
        defaultValue={defaultValue ?? ''}
        onChange={e => onChange?.(e.target.value)}
        className="w-40 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2
                   text-sm text-slate-100 truncate
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function DateInput({ label, name, defaultValue, accent = 'blue' }: {
  label: string;
  name: string;
  defaultValue: string;
  accent?: 'blue' | 'emerald';
}) {
  const ring = accent === 'blue' ? 'focus:ring-blue-500' : 'focus:ring-emerald-500';
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
        {label}
      </label>
      <input
        name={name}
        type="date"
        defaultValue={defaultValue}
        className={`w-36 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2
                   text-sm text-slate-100
                   focus:outline-none focus:ring-2 ${ring}`}
      />
    </div>
  );
}

export function VentasFiltros({
  sucursales, lineas, grupos, rubros,
  fechaDesde, fechaHasta,
  sucursalActual, lineaActual, grupoActual, rubroActual,
  fechaDesde2, fechaHasta2,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [comparar, setComparar] = useState(!!(fechaDesde2 && fechaHasta2));
  const [grupoSelected, setGrupoSelected] = useState(grupoActual ?? '');

  // Rubros filtrados por grupo seleccionado en el cliente
  const rubrosFiltered = useMemo(() =>
    grupoSelected
      ? rubros.filter(r => r.CodGrupo === grupoSelected)
      : rubros,
    [rubros, grupoSelected]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const get = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement)?.value ?? '';

    const params = new URLSearchParams({
      desde: get('desde'),
      hasta: get('hasta'),
    });

    const fields = ['sucursal', 'linea', 'grupo', 'rubro'] as const;
    for (const f of fields) {
      const v = get(f);
      if (v) params.set(f, v);
    }

    if (comparar) {
      params.set('desde2', get('desde2'));
      params.set('hasta2', get('hasta2'));
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  function handleQuitarComparacion() {
    setComparar(false);
    const params = new URLSearchParams({ desde: fechaDesde, hasta: fechaHasta });
    if (sucursalActual) params.set('sucursal', sucursalActual);
    if (lineaActual) params.set('linea', lineaActual);
    if (grupoActual) params.set('grupo', grupoActual);
    if (rubroActual) params.set('rubro', rubroActual);
    router.push(`${pathname}?${params.toString()}`);
  }

  const sucursalOpts = sucursales.map(s => ({ value: s.Codigo, label: s.Nombre }));
  const lineaOpts = lineas.map(l => ({ value: l.Codigo, label: l.Nombre }));
  const grupoOpts = grupos.map(g => ({ value: g.Codigo, label: g.Nombre }));
  const rubroOpts = rubrosFiltered.map(r => ({ value: r.Codigo, label: r.Nombre }));

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4"
    >
      {/* ── Fila 1: filtros generales ── */}
      <div className="flex flex-wrap gap-3 items-end">
        <Select
          label="Sucursal"
          name="sucursal"
          defaultValue={sucursalActual}
          options={sucursalOpts}
          placeholder="Todas"
        />
        <Select
          label="Línea"
          name="linea"
          defaultValue={lineaActual}
          options={lineaOpts}
          placeholder="Todas"
        />
        <Select
          label="Grupo"
          name="grupo"
          defaultValue={grupoActual}
          onChange={v => setGrupoSelected(v)}
          options={grupoOpts}
          placeholder="Todos"
        />
        <Select
          label="Rubro"
          name="rubro"
          defaultValue={rubroActual}
          options={rubroOpts}
          placeholder={grupoSelected ? 'Todos' : '— grupo primero —'}
        />
      </div>

      {/* ── Fila 2: períodos + acciones ── */}
      <div className="flex items-end gap-4 pt-3 border-t border-slate-800">

        {/* Columna Período A */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
            {comparar ? 'Período A' : 'Período'}
          </span>
          <div className="flex gap-3 items-end">
            <DateInput label="Desde" name="desde" defaultValue={fechaDesde} />
            <DateInput label="Hasta" name="hasta" defaultValue={fechaHasta} />
          </div>
        </div>

        {/* Columna Período B — solo si comparar */}
        {comparar && (
          <>
            <div className="w-px h-14 bg-slate-700 self-end" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                Período B
              </span>
              <div className="flex gap-3 items-end">
                <DateInput label="Desde" name="desde2" defaultValue={fechaDesde2 ?? fechaDesde} accent="emerald" />
                <DateInput label="Hasta" name="hasta2" defaultValue={fechaHasta2 ?? fechaHasta} accent="emerald" />
              </div>
            </div>
          </>
        )}

        {/* Acciones al final */}
        <div className="flex gap-2 ml-auto self-end">
          {!comparar ? (
            <button
              type="button"
              onClick={() => setComparar(true)}
              className="text-sm text-slate-400 border border-slate-700
                     hover:text-white hover:border-slate-500
                     px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              + Comparar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleQuitarComparacion}
              className="text-sm text-slate-500 hover:text-slate-300
                     transition-colors px-2 py-2 whitespace-nowrap"
            >
              ✕ Quitar comparación
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
    </form>
  );
}