import { COD_REGEX } from '@/features/shared/helpers';
import type { FiltrosArticulos } from './types';

export function buildWhereArticulos(filtros: FiltrosArticulos): string {
  const partes: string[] = [];

  if (filtros.codProveedor)  partes.push(`AND a.CodProveedor = '${filtros.codProveedor}'`);
  if (filtros.codLinea)      partes.push(`AND a.CodLinea     = '${filtros.codLinea}'`);
  if (filtros.codRubro)      partes.push(`AND a.CodRubro     = '${filtros.codRubro}'`);
  else if (filtros.codGrupo) partes.push(`AND r.CodGrupo     = '${filtros.codGrupo}'`);
  if (filtros.codSucursal)   partes.push(`AND fg.CodSucursal = '${filtros.codSucursal}'`);

  return partes.join('\n      ');
}

export function needsRubroJoin(filtros: FiltrosArticulos): boolean {
  return !!(filtros.codGrupo && !filtros.codRubro);
}

export function validarFiltrosArticulos(filtros: FiltrosArticulos): string[] {
  const errores: string[] = [];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(filtros.fechaDesde)) {
    errores.push('fechaDesde inválida');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(filtros.fechaHasta)) {
    errores.push('fechaHasta inválida');
  }
  if (filtros.fechaDesde > filtros.fechaHasta) {
    errores.push('fechaDesde no puede ser mayor que fechaHasta');
  }
  if (filtros.limite < 1 || filtros.limite > 100) {
    errores.push('limite debe estar entre 1 y 100');
  }

  const cods: [string | undefined, string][] = [
    [filtros.codProveedor, 'proveedor'],
    [filtros.codLinea,     'línea'],
    [filtros.codGrupo,     'grupo'],
    [filtros.codRubro,     'rubro'],
    [filtros.codSucursal,  'sucursal'],
  ];
  for (const [v, nombre] of cods) {
    if (v && !COD_REGEX.test(v)) {
      errores.push(`Código de ${nombre} inválido`);
    }
  }

  return errores;
}