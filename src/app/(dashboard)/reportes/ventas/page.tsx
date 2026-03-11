import { Suspense } from 'react';
import {
  getVentasPorVendedor,
  getSucursales,
  mergePeriodos,
} from '@/lib/queries/ventas';
import { VentasFiltros } from '@/components/reportes/ventas/VentasFiltros';
import { VentasChart }   from '@/components/reportes/ventas/VentasChart';
import { VentasTable }   from '@/components/reportes/ventas/VentasTable';

// ─── SearchParams ─────────────────────────────────────────────────────────────

interface SearchParams {
  desde?:    string;
  hasta?:    string;
  sucursal?: string;
  desde2?:   string;
  hasta2?:   string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function primerDiaMes(): string {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    .toISOString().split('T')[0]!;
}

function hoy(): string {
  return new Date().toISOString().split('T')[0]!;
}

function formatLabel(desde: string, hasta: string): string {
  return desde === hasta ? desde : `${desde} → ${hasta}`;
}

const fmt = (n: number) =>
  n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-20 bg-slate-900 border border-slate-800 rounded-xl" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-slate-900 border border-slate-800 rounded-xl" />
        ))}
      </div>
      <div className="h-80 bg-slate-900 border border-slate-800 rounded-xl" />
      <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl" />
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Contenido ────────────────────────────────────────────────────────────────

async function VentasContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;

  const fechaDesde  = params.desde    ?? primerDiaMes();
  const fechaHasta  = params.hasta    ?? hoy();
  const codSucursal = params.sucursal;
  const fechaDesde2 = params.desde2;
  const fechaHasta2 = params.hasta2;

  const modoComparacion = !!(fechaDesde2 && fechaHasta2);

  const [sucursales, periodoA, periodoB] = await Promise.all([
    getSucursales(),
    getVentasPorVendedor({ fechaDesde, fechaHasta, codSucursal }),
    modoComparacion
      ? getVentasPorVendedor({ fechaDesde: fechaDesde2!, fechaHasta: fechaHasta2!, codSucursal })
      : Promise.resolve(null),
  ]);

  const labelA = formatLabel(fechaDesde, fechaHasta);
  const labelB = modoComparacion ? formatLabel(fechaDesde2!, fechaHasta2!) : '';

  const totalA        = periodoA.reduce((s, v) => s + v.ImporteTotal, 0);
  const comprobantesA = periodoA.reduce((s, v) => s + v.CantidadComprobantes, 0);
  const articulosA    = periodoA.reduce((s, v) => s + v.CantidadArticulos, 0);

  const totalB = periodoB ? periodoB.reduce((s, v) => s + v.ImporteTotal, 0) : null;
  const difPct = totalB !== null && totalA > 0
    ? (((totalB - totalA) / totalA) * 100).toFixed(1)
    : null;

  const comparativa = modoComparacion && periodoB
    ? mergePeriodos(periodoA, periodoB)
    : null;

  return (
    <div className="space-y-5">

      <VentasFiltros
        sucursales={sucursales}
        fechaDesde={fechaDesde}
        fechaHasta={fechaHasta}
        sucursalActual={codSucursal}
        fechaDesde2={fechaDesde2}
        fechaHasta2={fechaHasta2}
      />

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Importe total"
          value={`$ ${fmt(totalA)}`}
          sub={modoComparacion && totalB !== null
            ? `Período B: $ ${fmt(totalB)} (${Number(difPct) > 0 ? '+' : ''}${difPct}%)`
            : undefined}
        />
        <KpiCard
          label="Artículos vendidos"
          value={articulosA.toLocaleString('es-AR')}
        />
        <KpiCard
          label="Comprobantes"
          value={comprobantesA.toLocaleString('es-AR')}
        />
      </div>

      {/* Gráfico */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">
          {modoComparacion
            ? `Top vendedores — ${labelA} vs ${labelB}`
            : 'Top vendedores por importe'}
        </h2>
        {comparativa ? (
          <VentasChart mode="comparativa" data={comparativa} labelA={labelA} labelB={labelB} />
        ) : (
          <VentasChart mode="normal" data={periodoA} />
        )}
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">
          {modoComparacion
            ? `Comparativa por vendedor — ${labelA} vs ${labelB}`
            : 'Detalle por vendedor y sucursal'}
        </h2>
        {comparativa ? (
          <VentasTable mode="comparativa" data={comparativa} labelA={labelA} labelB={labelB} />
        ) : (
          <VentasTable mode="normal" data={periodoA} />
        )}
      </div>

    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function VentasPage({ searchParams }: PageProps) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Ventas por Vendedor</h1>
        <p className="text-slate-400 text-sm mt-1">
          Comparativa de vendedores por importe y cantidad
        </p>
      </div>
      <Suspense fallback={<Skeleton />}>
        <VentasContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}