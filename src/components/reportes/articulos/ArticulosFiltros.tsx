'use client';

import { useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { Proveedor } from '@/features/articulos/queries/articulosMasVendidorPorProveedor.query';
import type { Linea, Grupo, Rubro, Sucursal } from '@/features/ventas/queries/ventasPorVendedor.query';

// Períodos rápidos
const PERIODOS_RAPIDOS = [
  { label: 'Esta semana',  dias: 7   },
  { label: 'Este mes',     dias: 30  },
  { label: 'Trimestre',    dias: 90  },
  { label: 'Este año',     dias: 365 },
] as const;

function toISO(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

interface Props {
  proveedores:     Proveedor[];
  sucursales:      Sucursal[];
  lineas:          Linea[];
  grupos:          Grupo[];
  rubros:          Rubro[];
  fechaDesde:      string;
  fechaHasta:      string;
  proveedorActual?: string;
  sucursalActual?:  string;
  lineaActual?:     string;
  grupoActual?:     string;
  rubroActual?:     string;
}

interface SelectProps {
  label:        string;
  name:         string;
  defaultValue?: string;
  onChange?:    (v: string) => void;
  options:      { value: string; label: string }[];
  placeholder:  string;
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

export function ArticulosFiltros({
  proveedores, sucursales, lineas, grupos, rubros,
  fechaDesde, fechaHasta,
  proveedorActual, sucursalActual, lineaActual, grupoActual, rubroActual,
}: Props) {
  const router   = useRouter();
  const pathname = usePathname();

  const [grupoSelected, setGrupoSelected] = useState(grupoActual ?? '');
  const [desdeVal, setDesdeVal] = useState(fechaDesde);
  const [hastaVal, setHastaVal] = useState(fechaHasta);

  const rubrosFiltered = useMemo(() =>
    grupoSelected
      ? rubros.filter(r => r.CodGrupo === grupoSelected)
      : rubros,
  [rubros, grupoSelected]);

  function aplicarPeriodoRapido(dias: number) {
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(desde.getDate() - dias);
    setDesdeVal(toISO(desde));
    setHastaVal(toISO(hasta));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const get  = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement)?.value ?? '';

    const params = new URLSearchParams({
      desde: get('desde'),
      hasta: get('hasta'),
    });

    const fields = ['proveedor', 'sucursal', 'linea', 'grupo', 'rubro'] as const;
    for (const f of fields) {
      const v = get(f);
      if (v) params.set(f, v);
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  const proveedorOpts = proveedores.map(p => ({ value: p.Codigo, label: p.Nombre }));
  const sucursalOpts  = sucursales.map(s  => ({ value: s.Codigo, label: s.Nombre }));
  const lineaOpts     = lineas.map(l      => ({ value: l.Codigo, label: l.Nombre }));
  const grupoOpts     = grupos.map(g      => ({ value: g.Codigo, label: g.Nombre }));
  const rubroOpts     = rubrosFiltered.map(r => ({ value: r.Codigo, label: r.Nombre }));

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4"
    >
      {/* ── Fila 1: filtros generales ── */}
      <div className="flex flex-wrap gap-3 items-end">
        <Select
          label="Proveedor"
          name="proveedor"
          defaultValue={proveedorActual}
          options={proveedorOpts}
          placeholder="Todos"
        />
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

      {/* ── Fila 2: período ── */}
      <div className="flex flex-wrap gap-3 items-end pt-3 border-t border-slate-800">

        {/* Períodos rápidos */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Período rápido
          </label>
          <div className="flex gap-2">
            {PERIODOS_RAPIDOS.map(p => (
              <button
                key={p.dias}
                type="button"
                onClick={() => aplicarPeriodoRapido(p.dias)}
                className="text-xs text-slate-400 border border-slate-700
                           hover:text-white hover:border-slate-500
                           px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Desde
          </label>
          <input
            name="desde"
            type="date"
            value={desdeVal}
            onChange={e => setDesdeVal(e.target.value)}
            className="w-36 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2
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
            value={hastaVal}
            onChange={e => setHastaVal(e.target.value)}
            className="w-36 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2
                       text-sm text-slate-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="self-end bg-blue-600 hover:bg-blue-500 text-white text-sm
                     font-semibold px-5 py-2 rounded-lg transition-colors"
        >
          Aplicar
        </button>
      </div>
    </form>
  );
}