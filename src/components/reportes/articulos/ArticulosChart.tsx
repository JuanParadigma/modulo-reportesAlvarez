'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { ArticuloVendido } from '@/lib/queries/articulos';

const COLORS = ['#3B82F6','#6366F1','#8B5CF6','#EC4899','#F59E0B',
                '#10B981','#06B6D4','#F97316','#84CC16','#EF4444'];

interface Props {
  data: ArticuloVendido[];
}

// Acortar nombre del artículo para el eje
function shortName(nombre: string): string {
  return nombre.length > 22 ? nombre.substring(0, 22) + '…' : nombre;
}

export function ArticulosChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        Sin datos para el período seleccionado
      </div>
    );
  }

  const chartData = data.map(a => ({
    nombre:    shortName(a.Articulo),
    completo:  a.Articulo,
    cantidad:  a.Cantidad,
    importe:   a.ImporteTotal,
    rank:      a.Rank,
  }));

  return (
    <ResponsiveContainer width="100%" height={380}>
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 4, right: 80, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => v.toLocaleString('es-AR')}
        />
        <YAxis
          type="category"
          dataKey="nombre"
          width={180}
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          contentStyle={{
            background: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#F1F5F9',
          }}
          formatter={(value: number, name: string) => [
            name === 'cantidad'
              ? value.toLocaleString('es-AR')
              : `$ ${value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
            name === 'cantidad' ? 'Cantidad' : 'Importe',
          ]}
          labelFormatter={(_: unknown, payload: { payload: { completo: string } }[]) =>
            payload?.[0]?.payload?.completo ?? ''
          }
        />
        <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} label={{
          position: 'right',
          fontSize: 11,
          fill: '#64748B',
          formatter: (v: number) => v.toLocaleString('es-AR'),
        }}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}