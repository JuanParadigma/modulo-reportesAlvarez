export interface Sucursal {
  Codigo: string;
  Nombre: string;
}

export interface Linea {
  Codigo: string;
  Nombre: string;
}

export interface Grupo {
  Codigo: string;
  Nombre: string;
}

export interface Rubro {
  Codigo:   string;
  Nombre:   string;
  CodGrupo: string;
}