import { Suspense } from 'react';
import {
  getTopArticulos,
  getProveedores,
} from '@/lib/queries/articulos';
import {
  getSucursales,
  getLineas,
  getGrupos,
  getRubros,
} from '@/lib/queries/ventas';
import { ArticulosFiltros } from '@/components/reportes/articulos/ArticulosFiltros';
import { ArticulosChart }   from '@/components/reportes/articulos/ArticulosChart';
import { ArticulosTable }   from '@/components/reportes/articulos/ArticulosTable';

// ─── SearchParams ─────────────────────────────────────────────────────────────

interface SearchParams {
  desde?:     string;
  hasta?:     string;
  proveedor?: string;
  sucursal?:  string;
  linea?:     string;
  grupo?:     string;
  rubro?:     string;
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

const fmt = (n: number) =>
  n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-28 bg-slate-900 border border-slate-800 rounded-xl" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-slate-900 border border-slate-800 rounded-xl" />
        ))}
      </div>
      <div className="h-96 bg-slate-900 border border-slate-800 rounded-xl" />
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

async function ArticulosContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;

  const fechaDesde   = params.desde     ?? primerDiaMes();
  const fechaHasta   = params.hasta     ?? hoy();
  const codProveedor = params.proveedor;
  const codSucursal  = params.sucursal;
  const codLinea     = params.linea;
  const codGrupo     = params.grupo;
  const codRubro     = params.rubro;

  const filtros = {
    fechaDesde, fechaHasta,
    codProveedor, codSucursal,
    codLinea, codGrupo, codRubro,
    limite: 10,
  };

  const [proveedores, sucursales, lineas, grupos, rubros, articulos] = await Promise.all([
    getProveedores(),
    getSucursales(),
    getLineas(),
    getGrupos(),
    getRubros(),
    getTopArticulos(filtros),
  ]);

  const totalCantidad = articulos.reduce((s, a) => s + a.Cantidad, 0);
  const totalImporte  = articulos.reduce((s, a) => s + a.ImporteTotal, 0);
  const totalSinIVA   = articulos.reduce((s, a) => s + a.ImporteSinIVA, 0);

  const proveedorNombre = codProveedor
    ? proveedores.find(p => p.Codigo === codProveedor)?.Nombre
    : undefined;

  const filtroLabel = [
    proveedorNombre,
    codLinea  && lineas.find(l => l.Codigo === codLinea)?.Nombre,
    codGrupo  && grupos.find(g => g.Codigo === codGrupo)?.Nombre,
    codRubro  && rubros.find(r => r.Codigo === codRubro)?.Nombre,
  ].filter(Boolean).join(' › ');

  return (
    <div className="space-y-5">

      <ArticulosFiltros
        proveedores={proveedores}
        sucursales={sucursales}
        lineas={lineas}
        grupos={grupos}
        rubros={rubros}
        fechaDesde={fechaDesde}
        fechaHasta={fechaHasta}
        proveedorActual={codProveedor}
        sucursalActual={codSucursal}
        lineaActual={codLinea}
        grupoActual={codGrupo}
        rubroActual={codRubro}
      />

      {filtroLabel && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Filtrando por:</span>
          <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
            {filtroLabel}
          </span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Artículos vendidos (top 10)"
          value={totalCantidad.toLocaleString('es-AR')}
        />
        <KpiCard
          label="Importe sin IVA"
          value={`$ ${fmt(totalSinIVA)}`}
        />
        <KpiCard
          label="Importe total"
          value={`$ ${fmt(totalImporte)}`}
        />
      </div>

      {/* Gráfico */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-1">
          Top 10 artículos más vendidos por cantidad
        </h2>
        {filtroLabel && (
          <p className="text-xs text-slate-500 mb-4">{filtroLabel}</p>
        )}
        <ArticulosChart data={articulos} />
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">
          Detalle top 10
        </h2>
        <ArticulosTable data={articulos} />
      </div>

    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function ArticulosPage({ searchParams }: PageProps) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Artículos más vendidos</h1>
        <p className="text-slate-400 text-sm mt-1">
          Ranking de artículos por cantidad vendida
        </p>
      </div>
      <Suspense fallback={<Skeleton />}>
        <ArticulosContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}