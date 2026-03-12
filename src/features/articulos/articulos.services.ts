import { articulosRepository } from './articulos.repository';
import { validarFiltrosArticulos } from './articulos.helpers';
import type { ArticuloVendido, FiltrosArticulos, Proveedor } from './types';

function validarOThrow(filtros: FiltrosArticulos): void {
  const errores = validarFiltrosArticulos(filtros);
  if (errores.length > 0) throw new Error(errores.join(', '));
}

export const articulosService = {

  async getTopVendidos(filtros: FiltrosArticulos): Promise<ArticuloVendido[]> {
    validarOThrow(filtros);
    return articulosRepository.findTopVendidos(filtros);
  },

  async getBottomVendidos(filtros: FiltrosArticulos): Promise<ArticuloVendido[]> {
    validarOThrow(filtros);
    return articulosRepository.findBottomVendidos(filtros);
  },

  async getProveedores(): Promise<Proveedor[]> {
    return articulosRepository.findProveedores();
  },

};
