export { open } from "jsr:@divy/duckdb@0.2.1";

// Needed as @divy/duckdb doesn't export types! GRRR!
/**
 * DuckDB Database type
 */
export type Database = {
  connect(): Connection;
  close(): void;
};

type Connection = {
  query<T = Record<string, unknown>>(sql: string): T[];
  prepare(sql: string): PreparedStatement;
  close(): void;
};

type PreparedStatement = {
  query<T = Record<string, unknown>>(...params: unknown[]): T[];
};
