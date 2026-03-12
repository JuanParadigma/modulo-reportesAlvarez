export const DATE_REGEX     = /^\d{4}-\d{2}-\d{2}$/;
export const COD_REGEX      = /^[a-zA-Z0-9]{1,20}$/;
export const SUCURSAL_REGEX = /^[a-zA-Z0-9]{1,10}$/;

export function validarFecha(fecha: string, nombre: string): void {
  if (!DATE_REGEX.test(fecha)) {
    throw new Error(`Formato de fecha inválido: ${nombre}`);
  }
}

export function validarCod(value: string | undefined, nombre: string): void {
  if (value && !COD_REGEX.test(value)) {
    throw new Error(`Código de ${nombre} inválido`);
  }
}

export function toSqlDate(fecha: string): string {
  return fecha.replace(/-/g, '');
}

export function formatLabel(desde: string, hasta: string): string {
  return desde === hasta ? desde : `${desde} → ${hasta}`;
}

export function toISO(date: Date): string {
  return date.toISOString().split('T')[0]!;
}