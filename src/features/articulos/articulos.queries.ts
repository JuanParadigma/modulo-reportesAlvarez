import type { FiltrosArticulos } from './types';
import { toSqlDate } from '@/features/shared/helpers';

const TIPOS_VENTA = `'01','03','08','13','24','27'`;
const TIPOS_NC    = `'04','05','22','25','28'`;
const TODOS_TIPOS = `${TIPOS_VENTA},${TIPOS_NC}`;

export type OrderDir = 'DESC' | 'ASC';

export function buildArticulosQuery(
  filtros:   FiltrosArticulos,
  orderDir:  OrderDir,
  whereSql:  string,
  joinRubro: string
): string {
  const cantidadCase = `
    SUM(CASE
      WHEN fg.CodTipoComprobante IN (${TIPOS_VENTA}) THEN fm.Cantidad
      WHEN fg.CodTipoComprobante IN (${TIPOS_NC})    THEN -fm.Cantidad
      ELSE 0
    END)`;

  return `
    SELECT TOP ${filtros.limite}
      RTRIM(a.Codigo)       AS CodArticulo,
      RTRIM(a.Nombre)       AS Articulo,
      RTRIM(a.CodProveedor) AS CodProveedor,
      RTRIM(p.Nombre)       AS Proveedor,
      ${cantidadCase}       AS Cantidad,
      SUM(CASE
        WHEN fg.CodTipoComprobante IN (${TIPOS_VENTA}) THEN fm.PrecioTotalSinIVA
        WHEN fg.CodTipoComprobante IN (${TIPOS_NC})    THEN -fm.PrecioTotalSinIVA
        ELSE 0
      END)                  AS ImporteSinIVA,
      SUM(CASE
        WHEN fg.CodTipoComprobante IN (${TIPOS_VENTA}) THEN fm.PrecioTotalConIVA
        WHEN fg.CodTipoComprobante IN (${TIPOS_NC})    THEN -fm.PrecioTotalConIVA
        ELSE 0
      END)                  AS ImporteTotal,
      ROW_NUMBER() OVER (ORDER BY ${cantidadCase} ${orderDir}) AS Rank
    FROM veFactMovimientos fm
    JOIN veFactGeneral  fg ON fg.Codigo    = fm.CodComprobante
    JOIN geArticulos    a  ON a.Codigo     = fm.CodArticulo
    JOIN cmProveedores  p  ON p.Codigo     = a.CodProveedor
    ${joinRubro}
    WHERE
      fg.Fecha >= '${toSqlDate(filtros.fechaDesde)}'
      AND fg.Fecha <= '${toSqlDate(filtros.fechaHasta)}'
      AND fg.CodTipoComprobante IN (${TODOS_TIPOS})
      ${whereSql}
    GROUP BY a.Codigo, a.Nombre, a.CodProveedor, p.Nombre
    ORDER BY Cantidad ${orderDir}
  `;
}

export function buildProveedoresQuery(): string {
  return `
    SELECT RTRIM(Codigo) AS Codigo, RTRIM(Nombre) AS Nombre
    FROM cmProveedores
    WHERE DeBaja = 'N'
    ORDER BY Nombre
  `;
}