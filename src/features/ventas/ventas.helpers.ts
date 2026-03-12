import { COD_REGEX } from '@/features/shared/helpers';
import type { VentasPorVendedor, VentasComparativa, FiltrosVentas } from './types';

export function buildWhereVentas(filtros: FiltrosVentas): string {
  const partes: string[] = [];
  if (filtros.codSucursal) partes.push(`AND fg.CodSucursal = '${filtros.codSucursal}'`);
  if (filtros.codLinea)    partes.push(`AND a.CodLinea     = '${filtros.codLinea}'`);
  if (filtros.codRubro)    partes.push(`AND a.CodRubro     = '${filtros.codRubro}'`);
  else if (filtros.codGrupo) partes.push(`AND r.CodGrupo   = '${filtros.codGrupo}'`);
  return partes.join('\n      ');
}

export function needsArticuloJoin(filtros: FiltrosVentas): boolean {
  return !!(filtros.codLinea || filtros.codGrupo || filtros.codRubro);
}

export function needsRubroJoin(filtros: FiltrosVentas): boolean {
  return !!(filtros.codGrupo && !filtros.codRubro);
}

export function validarFiltrosVentas(filtros: FiltrosVentas): string[] {
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

  const cods: [string | undefined, string][] = [
    [filtros.codSucursal, 'sucursal'],
    [filtros.codLinea,    'línea'],
    [filtros.codGrupo,    'grupo'],
    [filtros.codRubro,    'rubro'],
  ];
  for (const [v, nombre] of cods) {
    if (v && !COD_REGEX.test(v)) {
      errores.push(`Código de ${nombre} inválido`);
    }
  }

  return errores;
}

// Merge de dos períodos por CodVendedor — lógica pura, fácil de testear
export function mergePeriodos(
  periodoA: VentasPorVendedor[],
  periodoB: VentasPorVendedor[]
): VentasComparativa[] {
  const mapaA = new Map<string, VentasPorVendedor>();
  const mapaB = new Map<string, VentasPorVendedor>();

  // Agrupar por vendedor (puede tener múltiples sucursales)
  for (const v of periodoA) {
    const existing = mapaA.get(v.CodVendedor);
    if (existing) {
      existing.ImporteTotal         += v.ImporteTotal;
      existing.CantidadArticulos    += v.CantidadArticulos;
      existing.CantidadComprobantes += v.CantidadComprobantes;
    } else {
      mapaA.set(v.CodVendedor, { ...v });
    }
  }

  for (const v of periodoB) {
    const existing = mapaB.get(v.CodVendedor);
    if (existing) {
      existing.ImporteTotal         += v.ImporteTotal;
      existing.CantidadArticulos    += v.CantidadArticulos;
      existing.CantidadComprobantes += v.CantidadComprobantes;
    } else {
      mapaB.set(v.CodVendedor, { ...v });
    }
  }

  // Asignar ranks por importe
  const rankA = asignarRanks(mapaA);
  const rankB = asignarRanks(mapaB);

  // Union de todos los vendedores que aparecen en alguno de los dos períodos
  const todos = new Set([...mapaA.keys(), ...mapaB.keys()]);

  return Array.from(todos).map(cod => {
    const a = mapaA.get(cod);
    const b = mapaB.get(cod);

    const totalA = a?.ImporteTotal      ?? 0;
    const totalB = b?.ImporteTotal      ?? 0;
    const cantA  = a?.CantidadArticulos ?? 0;
    const cantB  = b?.CantidadArticulos ?? 0;
    const rA     = rankA.get(cod)       ?? 999;
    const rB     = rankB.get(cod)       ?? 999;

    return {
      CodVendedor:   cod,
      Vendedor:      a?.Vendedor ?? b?.Vendedor ?? cod,
      totalA,
      totalB,
      cantA,
      cantB,
      rankA:         rA,
      rankB:         rB,
      difAbsoluta:   totalB - totalA,
      difPorcentaje: totalA !== 0 ? ((totalB - totalA) / totalA) * 100 : 0,
      difCantidad:   cantB - cantA,
      cambioRanking: rA - rB, // positivo = subió en el ranking
    };
  }).sort((a, b) => b.totalB - a.totalB);
}

function asignarRanks(mapa: Map<string, VentasPorVendedor>): Map<string, number> {
  const sorted = Array.from(mapa.entries())
    .sort(([, a], [, b]) => b.ImporteTotal - a.ImporteTotal);
  const ranks = new Map<string, number>();
  sorted.forEach(([cod], i) => ranks.set(cod, i + 1));
  return ranks;
}