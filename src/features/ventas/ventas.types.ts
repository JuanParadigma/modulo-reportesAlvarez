export interface VentasPorVendedor {
  CodVendedor:          string;
  Vendedor:             string;
  CodSucursal:          string;
  CantidadComprobantes: number;
  CantidadArticulos:    number;
  ImporteSinIVA:        number;
  ImporteTotal:         number;
}

export interface VentasComparativa {
  CodVendedor:   string;
  Vendedor:      string;
  totalA:        number;
  cantA:         number;
  rankA:         number;
  totalB:        number;
  cantB:         number;
  rankB:         number;
  difAbsoluta:   number;
  difPorcentaje: number;
  difCantidad:   number;
  cambioRanking: number;
}

export interface FiltrosVentas {
  fechaDesde:    string;
  fechaHasta:    string;
  codSucursal?:  string;
  codLinea?:     string;
  codGrupo?:     string;
  codRubro?:     string;
}