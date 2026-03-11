'use client';

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell,
} from 'recharts';
import type { VentasPorVendedor, VentasComparativa } from '@/lib/queries/ventas';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMonto(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000)     return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)         return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function agruparPorVendedor(data: VentasPorVendedor[]) {
  const map = new Map<string, { nombre: string; importe: number }>();
  for (const row of data) {
    const e = map.get(row.CodVendedor);
    if (e) {
      e.importe += row.ImporteTotal;
    } else {
      map.set(row.CodVendedor, { nombre: row.Vendedor, importe: row.ImporteTotal });
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.importe - a.importe)
    .slice(0, 10);
}

// ─── Modo normal ─────────────────────────────────────────────────────────────

const COLORS = ['#3B82F6','#6366F1','#8B5CF6','#EC4899','#F59E0B','#10B981'];

interface PropsNormal {
  mode: 'normal';
  data: VentasPorVendedor[];
}

function ChartNormal({ data }: { data: VentasPorVendedor[] }) {
  const chartData = agruparPorVendedor(data);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 24, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
        <XAxis
          dataKey="nombre"
          tick={{ fontSize: 11, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => v.split(' ')[0]}
        />
        <YAxis
          tickFormatter={formatMonto}
          tick={{ fontSize: 11, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          contentStyle={{
            background: '#1E293B', border: '1px solid #334155',
            borderRadius: '8px', fontSize: '13px', color: '#F1F5F9',
          }}
          formatter={(value: number) => [
            `$ ${value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
            'Importe',
          ]}
          labelFormatter={(_: unknown, payload: { payload: { nombre: string } }[]) =>
            payload?.[0]?.payload?.nombre ?? ''
          }
        />
        <Bar dataKey="importe" radius={[4, 4, 0, 0]}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── Modo comparación ─────────────────────────────────────────────────────────

interface PropsComparativa {
  mode:       'comparativa';
  data:       VentasComparativa[];
  labelA:     string;
  labelB:     string;
}

function ChartComparativa({
  data,
  labelA,
  labelB,
}: {
  data: VentasComparativa[];
  labelA: string;
  labelB: string;
}) {
  // Top 10 por totalB
  const chartData = data.slice(0, 10).map(v => ({
    nombre:        v.Vendedor.split(' ')[0],
    nombreCompleto: v.Vendedor,
    totalA:        v.totalA,
    totalB:        v.totalB,
    difPct:        parseFloat(v.difPorcentaje.toFixed(1)),
  }));

  return (
    <ResponsiveContainer width="100%" height={340}>
      <ComposedChart data={chartData} margin={{ top: 4, right: 40, left: 24, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
        <XAxis
          dataKey="nombre"
          tick={{ fontSize: 11, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
        />
        {/* Eje izquierdo — montos */}
        <YAxis
          yAxisId="monto"
          tickFormatter={formatMonto}
          tick={{ fontSize: 11, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
        />
        {/* Eje derecho — diferencia % */}
        <YAxis
          yAxisId="pct"
          orientation="right"
          tickFormatter={v => `${v}%`}
          tick={{ fontSize: 11, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
        />
        <ReferenceLine yAxisId="pct" y={0} stroke="#334155" strokeDasharray="4 4" />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          contentStyle={{
            background: '#1E293B', border: '1px solid #334155',
            borderRadius: '8px', fontSize: '13px', color: '#F1F5F9',
          }}
          formatter={(value: number, name: string) => {
            if (name === 'difPct') return [`${value > 0 ? '+' : ''}${value}%`, 'Var. %'];
            if (name === 'totalA') return [`$ ${value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, labelA];
            if (name === 'totalB') return [`$ ${value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, labelB];
            return [value, name];
          }}
          labelFormatter={(_: unknown, payload: { payload: { nombreCompleto: string } }[]) =>
            payload?.[0]?.payload?.nombreCompleto ?? ''
          }
        />
        <Legend
          formatter={(value) => {
            if (value === 'totalA') return labelA;
            if (value === 'totalB') return labelB;
            if (value === 'difPct') return 'Variación %';
            return value;
          }}
          wrapperStyle={{ fontSize: '12px', color: '#94A3B8' }}
        />
        <Bar yAxisId="monto" dataKey="totalA" fill="#3B82F6" opacity={0.5} radius={[3,3,0,0]} />
        <Bar yAxisId="monto" dataKey="totalB" fill="#10B981" radius={[3,3,0,0]} />
        <Line
          yAxisId="pct"
          dataKey="difPct"
          type="monotone"
          stroke="#F59E0B"
          strokeWidth={2}
          dot={(props) => {
            const { cx, cy, payload } = props;
            const color = payload.difPct >= 0 ? '#10B981' : '#EF4444';
            return <circle key={cx} cx={cx} cy={cy} r={4} fill={color} stroke="none" />;
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

type Props = PropsNormal | PropsComparativa;

export function VentasChart(props: Props) {
  if (props.data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        Sin datos para el período seleccionado
      </div>
    );
  }

  if (props.mode === 'comparativa') {
    return (
      <ChartComparativa
        data={props.data}
        labelA={props.labelA}
        labelB={props.labelB}
      />
    );
  }

  return <ChartNormal data={props.data} />;
}