import { type Database } from "../deps/duckdb.ts";

/**
 * Class which manages loading SQL from strings or files and executing with params.
 */
export class Query {
  private db: Database;
  private _sql: string | undefined;

  /**
   * Create
   * @param db DuckDB database
   */
  constructor(db: Database) {
    this.db = db;
    globalThis.addEventListener("unload", () => {
      this.db.close();
    });
  }

  /**
   * Set query string
   */
  public set sql(sql: string) {
    this._sql = sql;
  }

  /**
   * Load SQL from file in filesystem to the query.
   *
   * @param path SQL file path
   */
  public async loadFile(path: string) {
    this.sql = await _internals.readTextFile(path);
  }

  /**
   * Execute the loaded query and return results.
   *
   * This builds a prepared statement and executes it.
   *
   * Parameters are passed in as per [DuckDB prepared statement execution documentation](https://duckdb.org/docs/sql/query_syntax/prepared_statements.html);
   *
   * @param params Parameters to pass to query
   * @returns Array of results
   */
  run<T = Record<string, unknown>>(...params: unknown[]) {
    if (!this._sql) throw new ReferenceError("SQL statement not set");

    const connection = this.db.connect();
    const prepared = connection.prepare(this._sql);
    const result = prepared.query(...params);
    connection.close();
    return result;
  }
}

export const _internals = {
  readTextFile: Deno.readTextFile,
};
