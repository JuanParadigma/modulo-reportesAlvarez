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