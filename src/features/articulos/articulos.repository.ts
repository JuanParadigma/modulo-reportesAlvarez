import { getPool, query } from '@/lib/db';
import { buildWhereArticulos, needsRubroJoin } from './articulos.helpers';
import { buildArticulosQuery, buildProveedoresQuery, type OrderDir } from './articulos.queries';
import type { ArticuloVendido, FiltrosArticulos, Proveedor } from './types';

async function executeArticulos(
  filtros:  FiltrosArticulos,
  orderDir: OrderDir
): Promise<ArticuloVendido[]> {
  const whereSql  = buildWhereArticulos(filtros);
  const joinRubro = needsRubroJoin(filtros)
    ? 'JOIN geRubros r ON a.CodRubro = r.Codigo'
    : '';

  const sql    = buildArticulosQuery(filtros, orderDir, whereSql, joinRubro);
  const pool   = await getPool();
  const result = await pool.request().query<ArticuloVendido>(sql);
  return result.recordset;
}

export const articulosRepository = {
  findTopVendidos:    (f: FiltrosArticulos) => executeArticulos(f, 'DESC'),
  findBottomVendidos: (f: FiltrosArticulos) => executeArticulos(f, 'ASC'),
  findProveedores:    ()                    => query<Proveedor>(buildProveedoresQuery()),
};