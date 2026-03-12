import { query, getPool } from '@/lib/db';

const TIPOS_VENTA = `'01','03','08','13','24','27'`;
const TIPOS_NC    = `'04','05','22','25','28'`;
const TODOS_TIPOS = `${TIPOS_VENTA},${TIPOS_NC}`;

const DATE_REGEX     = /^\d{4}-\d{2}-\d{2}$/;
const COD_REGEX      = /^[a-zA-Z0-9]{1,20}$/;

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface Proveedor {
  Codigo: string;
  Nombre: string;
}

export interface ArticuloVendido {
  CodArticulo:   string;
  Articulo:      string;
  CodProveedor:  string;
  Proveedor:     string;
  Cantidad:      number;
  ImporteSinIVA: number;
  ImporteTotal:  number;
  Rank:          number;
}

export interface FiltrosArticulos {
  fechaDesde:    string;
  fechaHasta:    string;
  codProveedor?: string;
  codLinea?:     string;
  codGrupo?:     string;
  codRubro?:     string;
  codSucursal?:  string;
  limite:        number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function validarFiltros(filtros: FiltrosArticulos): void {
  if (!DATE_REGEX.test(filtros.fechaDesde) || !DATE_REGEX.test(filtros.fechaHasta)) {
    throw new Error('Formato de fecha inválido');
  }
  const cods: [string | undefined, string][] = [
    [filtros.codProveedor, 'proveedor'],
    [filtros.codLinea,     'línea'],
    [filtros.codGrupo,     'grupo'],
    [filtros.codRubro,     'rubro'],
    [filtros.codSucursal,  'sucursal'],
  ];
  for (const [v, nombre] of cods) {
    if (v && !COD_REGEX.test(v)) throw new Error(`Código de ${nombre} inválido`);
  }
}

function buildWhere(filtros: FiltrosArticulos): string {
  const partes: string[] = [];
  if (filtros.codProveedor) partes.push(`AND a.CodProveedor = '${filtros.codProveedor}'`);
  if (filtros.codLinea)     partes.push(`AND a.CodLinea     = '${filtros.codLinea}'`);
  if (filtros.codRubro)     partes.push(`AND a.CodRubro     = '${filtros.codRubro}'`);
  else if (filtros.codGrupo) partes.push(`AND r.CodGrupo    = '${filtros.codGrupo}'`);
  if (filtros.codSucursal)  partes.push(`AND fg.CodSucursal = '${filtros.codSucursal}'`);
  return partes.join('\n      ');
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getTopArticulos(
  filtros: FiltrosArticulos
): Promise<ArticuloVendido[]> {
  validarFiltros(filtros);

  const necesitaRubro = !!(filtros.codGrupo && !filtros.codRubro);
  const joinRubro     = necesitaRubro
    ? `JOIN geRubros r ON a.CodRubro = r.Codigo`
    : '';
  const whereSql = buildWhere(filtros);

  const pool   = await getPool();
  const result = await pool.request().query<ArticuloVendido>(`
    SELECT TOP ${filtros.limite}
      a.Codigo                  AS CodArticulo,
      a.Nombre                  AS Articulo,
      a.CodProveedor            AS CodProveedor,
      p.Nombre                  AS Proveedor,
      SUM(CASE
        WHEN fg.CodTipoComprobante IN (${TIPOS_VENTA}) THEN fm.Cantidad
        WHEN fg.CodTipoComprobante IN (${TIPOS_NC})    THEN -fm.Cantidad
        ELSE 0
      END)                      AS Cantidad,
      SUM(CASE
        WHEN fg.CodTipoComprobante IN (${TIPOS_VENTA}) THEN fm.PrecioTotalSinIVA
        WHEN fg.CodTipoComprobante IN (${TIPOS_NC})    THEN -fm.PrecioTotalSinIVA
        ELSE 0
      END)                      AS ImporteSinIVA,
      SUM(CASE
        WHEN fg.CodTipoComprobante IN (${TIPOS_VENTA}) THEN fm.PrecioTotalConIVA
        WHEN fg.CodTipoComprobante IN (${TIPOS_NC})    THEN -fm.PrecioTotalConIVA
        ELSE 0
      END)                      AS ImporteTotal,
      ROW_NUMBER() OVER (ORDER BY SUM(CASE
        WHEN fg.CodTipoComprobante IN (${TIPOS_VENTA}) THEN fm.Cantidad
        WHEN fg.CodTipoComprobante IN (${TIPOS_NC})    THEN -fm.Cantidad
        ELSE 0
      END) DESC)                AS Rank
    FROM veFactMovimientos fm
    JOIN veFactGeneral  fg ON fg.Codigo        = fm.CodComprobante
    JOIN geArticulos    a  ON a.Codigo         = fm.CodArticulo
    JOIN cmProveedores  p  ON p.Codigo         = a.CodProveedor
    ${joinRubro}
    WHERE
      fg.Fecha >= '${filtros.fechaDesde.replace(/-/g, '')}'
      AND fg.Fecha <= '${filtros.fechaHasta.replace(/-/g, '')}'
      AND fg.CodTipoComprobante IN (${TODOS_TIPOS})
      ${whereSql}
    GROUP BY a.Codigo, a.Nombre, a.CodProveedor, p.Nombre
    ORDER BY Cantidad DESC
  `);

  return result.recordset;
}

export async function getProveedores(): Promise<Proveedor[]> {
  return query<Proveedor>(`
    SELECT RTRIM(Codigo) AS Codigo, RTRIM(Nombre) AS Nombre
    FROM cmProveedores
    WHERE DeBaja = 'N'
    ORDER BY Nombre
  `);
}