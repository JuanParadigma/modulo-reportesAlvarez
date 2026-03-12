import type { FiltrosVentas } from './types';
import { toSqlDate } from '@/features/shared/helpers';

const TIPOS_VENTA = `'01','03','08','13','24','27'`;
const TIPOS_NC    = `'04','05','22','25','28'`;
const TODOS_TIPOS = `${TIPOS_VENTA},${TIPOS_NC}`;

export function buildVentasQuery(
  filtros:      FiltrosVentas,
  whereSql:     string,
  joinArticulo: string,
  joinRubro:    string
): string {
  return `
    SELECT
      v.Codigo                  AS CodVendedor,
      v.Nombre                  AS Vendedor,
      fg.CodSucursal            AS CodSucursal,
      COUNT(DISTINCT fg.Codigo) AS CantidadComprobantes,
      SUM(CASE
        WHEN fg.CodTipoComprobante IN (${TIPOS_VENTA}) THEN fm.Cantidad
        WHEN fg.CodTipoComprobante IN (${TIPOS_NC})    THEN -fm.Cantidad
        ELSE 0
      END)                      AS CantidadArticulos,
      SUM(CASE
        WHEN fg.CodTipoComprobante IN (${TIPOS_VENTA}) THEN cab.TotalSinIVA
        WHEN fg.CodTipoComprobante IN (${TIPOS_NC})    THEN -cab.TotalSinIVA
        ELSE 0
      END)                      AS ImporteSinIVA,
      SUM(CASE
        WHEN fg.CodTipoComprobante IN (${TIPOS_VENTA}) THEN cab.TotalConIVA
        WHEN fg.CodTipoComprobante IN (${TIPOS_NC})    THEN -cab.TotalConIVA
        ELSE 0
      END)                      AS ImporteTotal
    FROM veFactGeneral fg
    JOIN veVendedores v ON fg.CodVendedor = v.Codigo
    JOIN (
      SELECT
        CodComprobante,
        SUM(PrecioTotalSinIVA) AS TotalSinIVA,
        SUM(PrecioTotalConIVA) AS TotalConIVA
      FROM veFactMovimientos
      GROUP BY CodComprobante
    ) cab ON cab.CodComprobante = fg.Codigo
    JOIN veFactMovimientos fm ON fm.CodComprobante = fg.Codigo
    ${joinArticulo}
    ${joinRubro}
    WHERE
      fg.Fecha >= '${toSqlDate(filtros.fechaDesde)}'
      AND fg.Fecha <= '${toSqlDate(filtros.fechaHasta)}'
      AND fg.CodTipoComprobante IN (${TODOS_TIPOS})
      ${whereSql}
    GROUP BY v.Codigo, v.Nombre, fg.CodSucursal
    ORDER BY ImporteTotal DESC
  `;
}

export function buildSucursalesQuery(): string {
  return `
    SELECT RTRIM(Codigo) AS Codigo, RTRIM(Nombre) AS Nombre
    FROM geSucursales
    WHERE DeBaja = 'N'
    ORDER BY Nombre
  `;
}

export function buildLineasQuery(): string {
  return `
    SELECT RTRIM(Codigo) AS Codigo, RTRIM(Nombre) AS Nombre
    FROM geLineas
    WHERE DeBaja = 'N'
    ORDER BY Nombre
  `;
}

export function buildGruposQuery(): string {
  return `
    SELECT RTRIM(Codigo) AS Codigo, RTRIM(Nombre) AS Nombre
    FROM geGrupos
    WHERE DeBaja = 'N'
    ORDER BY Nombre
  `;
}

export function buildRubrosQuery(codGrupo?: string): string {
  const where = codGrupo ? `AND CodGrupo = '${codGrupo}'` : '';
  return `
    SELECT RTRIM(Codigo) AS Codigo, RTRIM(Nombre) AS Nombre, RTRIM(CodGrupo) AS CodGrupo
    FROM geRubros
    WHERE DeBaja = 'N'
    ${where}
    ORDER BY Nombre
  `;
}