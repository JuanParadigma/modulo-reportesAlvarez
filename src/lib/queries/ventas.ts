import { query, getPool } from '@/lib/db';

// ─── Constantes ──────────────────────────────────────────────────────────────

const TIPOS_VENTA = `'01','03','08','13','24','27'`;
const TIPOS_NC    = `'04','05','22','25','28'`;
const TODOS_TIPOS = `${TIPOS_VENTA},${TIPOS_NC}`;

const DATE_REGEX     = /^\d{4}-\d{2}-\d{2}$/;
const SUCURSAL_REGEX = /^[a-zA-Z0-9]{1,10}$/;

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface VentasPorVendedor {
  CodVendedor:          string;
  Vendedor:             string;
  CodSucursal:          string;
  CantidadComprobantes: number;
  CantidadArticulos:    number;
  ImporteSinIVA:        number;
  ImporteTotal:         number;
}

export interface Sucursal {
  Codigo: string;
  Nombre: string;
}

export interface FiltrosVentas {
  fechaDesde:   string;
  fechaHasta:   string;
  codSucursal?: string;
}

export interface VentasComparativa {
  CodVendedor:   string;
  Vendedor:      string;
  totalA:        number;
  cantA:         number;
  rankA:         number;
  totalB:        number;
  cantB:         number;
  rankB:         number;
  difAbsoluta:   number;
  difPorcentaje: number;
  difCantidad:   number;
  cambioRanking: number;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getVentasPorVendedor(
  filtros: FiltrosVentas
): Promise<VentasPorVendedor[]> {

  if (!DATE_REGEX.test(filtros.fechaDesde) || !DATE_REGEX.test(filtros.fechaHasta)) {
    throw new Error('Formato de fecha inválido');
  }

  let sucursalFilter = '';
  if (filtros.codSucursal) {
    if (!SUCURSAL_REGEX.test(filtros.codSucursal)) {
      throw new Error('Código de sucursal inválido');
    }
    sucursalFilter = `AND fg.CodSucursal = '${filtros.codSucursal}'`;
  }

  const pool = await getPool();
  const result = await pool.request().query<VentasPorVendedor>(`
    SELECT
      v.Codigo                    AS CodVendedor,
      v.Nombre                    AS Vendedor,
      fg.CodSucursal              AS CodSucursal,
      COUNT(DISTINCT fg.Codigo)   AS CantidadComprobantes,
      SUM(CASE
        WHEN fg.CodTipoComprobante IN (${TIPOS_VENTA}) THEN fm.Cantidad
        WHEN fg.CodTipoComprobante IN (${TIPOS_NC})    THEN -fm.Cantidad
        ELSE 0
      END)                        AS CantidadArticulos,
      SUM(CASE
        WHEN fg.CodTipoComprobante IN (${TIPOS_VENTA}) THEN fm.PrecioTotalSinIVA
        WHEN fg.CodTipoComprobante IN (${TIPOS_NC})    THEN -fm.PrecioTotalSinIVA
        ELSE 0
      END)                        AS ImporteSinIVA,
      SUM(CASE
        WHEN fg.CodTipoComprobante IN (${TIPOS_VENTA}) THEN fg.Total
        WHEN fg.CodTipoComprobante IN (${TIPOS_NC})    THEN -fg.Total
        ELSE 0
      END)                        AS ImporteTotal
    FROM veFactGeneral fg
    JOIN veVendedores v       ON fg.CodVendedor    = v.Codigo
    JOIN veFactMovimientos fm ON fm.CodComprobante = fg.Codigo
    WHERE
      fg.Fecha >= '${filtros.fechaDesde} 00:00:00'
      AND fg.Fecha <= '${filtros.fechaHasta} 23:59:59'
      AND fg.CodTipoComprobante IN (${TODOS_TIPOS})
      ${sucursalFilter}
    GROUP BY v.Codigo, v.Nombre, fg.CodSucursal
    ORDER BY ImporteTotal DESC
  `);

  return result.recordset;
}

export async function getSucursales(): Promise<Sucursal[]> {
  return query<Sucursal>(`
    SELECT Codigo, Nombre
    FROM geSucursales
    WHERE DeBaja = 'N'
    ORDER BY Nombre
  `);
}

// ─── Comparativa ─────────────────────────────────────────────────────────────

export function mergePeriodos(
  periodoA: VentasPorVendedor[],
  periodoB: VentasPorVendedor[]
): VentasComparativa[] {

  function agrupar(rows: VentasPorVendedor[]): Map<string, {
    nombre:   string;
    total:    number;
    cantidad: number;
  }> {
    const map = new Map<string, { nombre: string; total: number; cantidad: number }>();
    for (const row of rows) {
      const existing = map.get(row.CodVendedor);
      if (existing) {
        existing.total    += row.ImporteTotal;
        existing.cantidad += row.CantidadArticulos;
      } else {
        map.set(row.CodVendedor, {
          nombre:   row.Vendedor,
          total:    row.ImporteTotal,
          cantidad: row.CantidadArticulos,
        });
      }
    }
    return map;
  }

  const mapA = agrupar(periodoA);
  const mapB = agrupar(periodoB);

  const rankingA = Array.from(mapA.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .map(([cod], i) => ({ cod, rank: i + 1 }));

  const rankingB = Array.from(mapB.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .map(([cod], i) => ({ cod, rank: i + 1 }));

  const rankMapA = new Map(rankingA.map(r => [r.cod, r.rank]));
  const rankMapB = new Map(rankingB.map(r => [r.cod, r.rank]));

  const allCods = new Set([...mapA.keys(), ...mapB.keys()]);
  const result: VentasComparativa[] = [];

  for (const cod of allCods) {
    const a = mapA.get(cod);
    const b = mapB.get(cod);

    const totalA = a?.total    ?? 0;
    const cantA  = a?.cantidad ?? 0;
    const totalB = b?.total    ?? 0;
    const cantB  = b?.cantidad ?? 0;
    const rankA  = rankMapA.get(cod) ?? 999;
    const rankB  = rankMapB.get(cod) ?? 999;

    result.push({
      CodVendedor:   cod,
      Vendedor:      a?.nombre ?? b?.nombre ?? cod,
      totalA,
      cantA,
      rankA,
      totalB,
      cantB,
      rankB,
      difAbsoluta:   totalB - totalA,
      difPorcentaje: totalA === 0 ? 0 : ((totalB - totalA) / totalA) * 100,
      difCantidad:   cantB - cantA,
      cambioRanking: rankA - rankB,
    });
  }

  return result.sort((a, b) => b.totalB - a.totalB);
}