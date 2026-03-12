import { ventasRepository } from './ventas.repository';
import { validarFiltrosVentas, mergePeriodos } from './ventas.helpers';
import type {
    VentasPorVendedor,
    VentasComparativa,
    FiltrosVentas,
} from './ventas.types';

function validarOThrow(filtros: FiltrosVentas): void {
    const errores = validarFiltrosVentas(filtros);
    if (errores.length > 0) throw new Error(errores.join(', '));
}

export const ventasService = {

    async getVentasPorVendedor(filtros: FiltrosVentas): Promise<VentasPorVendedor[]> {
        validarOThrow(filtros);
        return ventasRepository.findVentasPorVendedor(filtros);
    },

    async getComparativa(
        filtrosA: FiltrosVentas,
        filtrosB: FiltrosVentas
    ): Promise<VentasComparativa[]> {
        validarOThrow(filtrosA);
        validarOThrow(filtrosB);
        const [periodoA, periodoB] = await Promise.all([
            ventasRepository.findVentasPorVendedor(filtrosA),
            ventasRepository.findVentasPorVendedor(filtrosB),
        ]);
        return mergePeriodos(periodoA, periodoB);
    },
    mergeComparativa: (
        periodoA: VentasPorVendedor[],
        periodoB: VentasPorVendedor[]
    ): VentasComparativa[] => mergePeriodos(periodoA, periodoB),
    getSucursales: () => ventasRepository.findSucursales(),
    getLineas: () => ventasRepository.findLineas(),
    getGrupos: () => ventasRepository.findGrupos(),
    getRubros: (codGrupo?: string) => ventasRepository.findRubros(codGrupo),
};