// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MssqlType = any;

export interface SqlParam {
  type: MssqlType;
  value: unknown;
}

export type SqlParams = Record<string, SqlParam>;