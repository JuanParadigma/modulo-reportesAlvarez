'use client';

import { useState, useEffect } from 'react';
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import type { ArticuloVendido } from '@/lib/queries/articulos';

const fmt = (n: number) =>
  n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const columns: ColumnDef<ArticuloVendido>[] = [
  {
    accessorKey: 'Rank',
    header: '#',
    cell: i => (
      <span className="text-slate-500 font-mono text-xs font-semibold">
        #{i.getValue<number>()}
      </span>
    ),
  },
  {
    accessorKey: 'Articulo',
    header: 'Artículo',
    cell: i => (
      <span className="font-medium text-slate-100 text-sm">
        {i.getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: 'CodArticulo',
    header: 'Código',
    cell: i => (
      <span className="text-slate-500 font-mono text-xs">
        {i.getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: 'Proveedor',
    header: 'Proveedor',
    cell: i => (
      <span className="text-slate-400 text-xs">
        {i.getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: 'Cantidad',
    header: 'Cantidad',
    cell: i => (
      <span className="font-semibold text-white text-sm">
        {i.getValue<number>().toLocaleString('es-AR')}
      </span>
    ),
  },
  {
    accessorKey: 'ImporteSinIVA',
    header: 'Sin IVA',
    cell: i => (
      <span className="text-slate-300 font-mono text-xs">
        $ {fmt(i.getValue<number>())}
      </span>
    ),
  },
  {
    accessorKey: 'ImporteTotal',
    header: 'Total',
    cell: i => (
      <span className="font-semibold text-white font-mono text-xs">
        $ {fmt(i.getValue<number>())}
      </span>
    ),
  },
];

interface Props {
  data: ArticuloVendido[];
}

export function ArticulosTable({ data }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    setSorting([{ id: 'Cantidad', desc: true }]);
  }, []);

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
                             uppercase tracking-wide py-2 px-3
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
                <td key={cell.id} className="py-2 px-3">
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