import { getPool, query } from '@/lib/db';
import { buildWhereVentas, needsArticuloJoin, needsRubroJoin } from './ventas.helpers';
import {
  buildVentasQuery,
  buildSucursalesQuery,
  buildLineasQuery,
  buildGruposQuery,
  buildRubrosQuery,
} from './ventas.queries';
import type { VentasPorVendedor, FiltrosVentas } from './ventas.types';
import type { Sucursal, Linea, Grupo, Rubro } from '@/features/shared/types';

async function executeVentas(filtros: FiltrosVentas): Promise<VentasPorVendedor[]> {
  const whereSql     = buildWhereVentas(filtros);
  const joinArticulo = needsArticuloJoin(filtros)
    ? 'JOIN geArticulos a ON a.Codigo = fm.CodArticulo'
    : '';
  const joinRubro    = needsRubroJoin(filtros)
    ? 'JOIN geRubros r ON a.CodRubro = r.Codigo'
    : '';

  const sql    = buildVentasQuery(filtros, whereSql, joinArticulo, joinRubro);
  const pool   = await getPool();
  const result = await pool.request().query<VentasPorVendedor>(sql);
  return result.recordset;
}

export const ventasRepository = {
  findVentasPorVendedor: (f: FiltrosVentas) => executeVentas(f),
  findSucursales:        ()                  => query<Sucursal>(buildSucursalesQuery()),
  findLineas:            ()                  => query<Linea>(buildLineasQuery()),
  findGrupos:            ()                  => query<Grupo>(buildGruposQuery()),
  findRubros:            (codGrupo?: string) => query<Rubro>(buildRubrosQuery(codGrupo)),
};