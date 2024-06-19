import type { columnTypes } from "../lib/types.d.ts";

export { open } from "jsr:@divy/duckdb@0.2.1";

// Needed as @divy/duckdb doesn't export types! GRRR!
/**
 * DuckDB Database type
 */
export type Database = {
  connect(): Connection;
  close(): void;
};

export type Connection = {
  query<T = Record<string, unknown>>(sql: string): T[];
  prepare(sql: string): PreparedStatement;
  close(): void;
};

export type PreparedStatement = {
  query<T = Record<string, columnTypes>>(...params: columnTypes[]): T[];
  close(): void;
};
