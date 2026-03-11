'use client';

import { useState, useEffect } from 'react';
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import type { VentasPorVendedor, VentasComparativa } from '@/lib/queries/ventas';

const fmt = (n: number) =>
  n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Modo normal ──────────────────────────────────────────────────────────────

const colsNormal: ColumnDef<VentasPorVendedor>[] = [
  {
    accessorKey: 'Vendedor',
    header: 'Vendedor',
    cell: i => <span className="font-medium text-slate-100">{i.getValue<string>()}</span>,
  },
  {
    accessorKey: 'CodSucursal',
    header: 'Suc.',
    cell: i => <span className="text-slate-400 font-mono text-xs">{i.getValue<string>()}</span>,
  },
  {
    accessorKey: 'CantidadComprobantes',
    header: 'Comprobantes',
    cell: i => <span className="text-slate-300">{i.getValue<number>().toLocaleString('es-AR')}</span>,
  },
  {
    accessorKey: 'CantidadArticulos',
    header: 'Artículos',
    cell: i => <span className="text-slate-300">{i.getValue<number>().toLocaleString('es-AR')}</span>,
  },
  {
    accessorKey: 'ImporteSinIVA',
    header: 'Sin IVA',
    cell: i => <span className="text-slate-300 font-mono text-sm">$ {fmt(i.getValue<number>())}</span>,
  },
  {
    accessorKey: 'ImporteTotal',
    header: 'Total',
    cell: i => <span className="font-semibold text-white font-mono text-sm">$ {fmt(i.getValue<number>())}</span>,
  },
];

// ─── Modo comparativa ─────────────────────────────────────────────────────────

function RankingBadge({ cambio }: { cambio: number }) {
  if (cambio === 0) return <span className="text-slate-500 text-xs">—</span>;
  const subio = cambio > 0;
  return (
    <span className={`text-xs font-semibold ${subio ? 'text-emerald-400' : 'text-red-400'}`}>
      {subio ? '▲' : '▼'} {Math.abs(cambio)}
    </span>
  );
}

function DifPct({ value }: { value: number }) {
  const color = value > 0 ? 'text-emerald-400' : value < 0 ? 'text-red-400' : 'text-slate-500';
  return (
    <span className={`font-semibold text-sm ${color}`}>
      {value > 0 ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

function buildColsComparativa(labelA: string, labelB: string): ColumnDef<VentasComparativa>[] {
  return [
    {
      accessorKey: 'Vendedor',
      header: 'Vendedor',
      cell: i => <span className="font-medium text-slate-100">{i.getValue<string>()}</span>,
    },
    {
      accessorKey: 'cantA',
      header: `Cant. ${labelA}`,
      cell: i => (
        <span className="text-blue-300 text-sm">
          {i.getValue<number>().toLocaleString('es-AR')}
        </span>
      ),
    },
    {
      accessorKey: 'cantB',
      header: `Cant. ${labelB}`,
      cell: i => (
        <span className="text-emerald-300 text-sm">
          {i.getValue<number>().toLocaleString('es-AR')}
        </span>
      ),
    },
    {
      accessorKey: 'difCantidad',
      header: 'Var. Cant.',
      cell: i => {
        const v = i.getValue<number>();
        const color = v > 0 ? 'text-emerald-400' : v < 0 ? 'text-red-400' : 'text-slate-500';
        return (
          <span className={`text-sm font-semibold ${color}`}>
            {v > 0 ? '+' : ''}{v.toLocaleString('es-AR')}
          </span>
        );
      },
    },
    {
      accessorKey: 'totalA',
      header: `$ ${labelA}`,
      cell: i => (
        <span className="text-blue-300 font-mono text-sm">
          $ {fmt(i.getValue<number>())}
        </span>
      ),
    },
    {
      accessorKey: 'totalB',
      header: `$ ${labelB}`,
      cell: i => (
        <span className="text-emerald-300 font-mono text-sm">
          $ {fmt(i.getValue<number>())}
        </span>
      ),
    },
    {
      accessorKey: 'difAbsoluta',
      header: 'Dif. $',
      cell: i => {
        const v = i.getValue<number>();
        const color = v > 0 ? 'text-emerald-400' : v < 0 ? 'text-red-400' : 'text-slate-500';
        return (
          <span className={`font-mono text-sm font-semibold ${color}`}>
            {v > 0 ? '+' : ''}$ {fmt(v)}
          </span>
        );
      },
    },
    {
      accessorKey: 'difPorcentaje',
      header: 'Var. %',
      cell: i => <DifPct value={i.getValue<number>()} />,
    },
    {
      accessorKey: 'cambioRanking',
      header: 'Ranking',
      cell: i => <RankingBadge cambio={i.getValue<number>()} />,
    },
  ];
}

// ─── Tabla genérica ───────────────────────────────────────────────────────────

function Tabla<T extends object>({
  data,
  columns,
  sortKey,
}: {
  data: T[];
  columns: ColumnDef<T>[];
  sortKey: string;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    setSorting([{ id: sortKey, desc: true }]);
  }, [sortKey]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (data.length === 0) {
    return (
      <p className="text-center text-slate-500 text-sm py-8">
        Sin datos para el período seleccionado
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id} className="border-b border-slate-800">
              {hg.headers.map(header => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="text-left text-xs font-semibold text-slate-500
                             uppercase tracking-wide py-3 px-4
                             cursor-pointer hover:text-slate-300
                             select-none transition-colors whitespace-nowrap"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, i) => (
            <tr
              key={row.id}
              className={`border-b border-slate-800/50 hover:bg-slate-800/40
                         transition-colors
                         ${i % 2 === 0 ? 'bg-transparent' : 'bg-slate-900/30'}`}
            >
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="py-3 px-4">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

interface PropsNormal {
  mode: 'normal';
  data: VentasPorVendedor[];
}

interface PropsComparativa {
  mode:   'comparativa';
  data:   VentasComparativa[];
  labelA: string;
  labelB: string;
}

type Props = PropsNormal | PropsComparativa;

export function VentasTable(props: Props) {
  if (props.mode === 'comparativa') {
    return (
      <Tabla
        data={props.data}
        columns={buildColsComparativa(props.labelA, props.labelB)}
        sortKey="totalB"
      />
    );
  }

  return (
    <Tabla
      data={props.data}
      columns={colsNormal}
      sortKey="ImporteTotal"
    />
  );
}