import type {
  Connection,
  Database,
  PreparedStatement,
} from "../deps/duckdb.ts";
import type { columnTypes } from "./types.d.ts";

/**
 * Class which manages loading SQL from strings or files and executing with params.
 */
export class Query {
  #connection: Connection;
  #sql: string | undefined;
  #prepared: PreparedStatement | undefined;

  /**
   * Create
   * @param db DuckDB database
   */
  constructor(db: Database) {
    this.#connection = db.connect();
    globalThis.addEventListener("unload", () => {
      if (this.#prepared) this.#prepared.close();
      this.#connection.close();
    });
  }

  /**
   * Set query string
   */
  public set sql(sql: string) {
    this.#sql = sql;
    this.#prepare();
  }

  public get sql(): string {
    if (!this.#sql) {
      return "NO SQL LOADED";
    }
    return this.#sql;
  }

  /**
   * Prepare the SQL statement
   */
  #prepare() {
    if (!this.#sql) {
      throw new ReferenceError('No SQL Provided');
    }
    if (this.#prepared) {
      this.#prepared.close();
      this.#prepared = undefined;
    }
    this.#prepared = this.#connection.prepare(this.#sql);
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
  run<T = Record<string, columnTypes>>(...params: columnTypes[]): T[] {
    // TODO: Fix this workaround to what might be a caching issue.
    // Running the same query twice leads to nulls being returned as zeroes second time only.
    // I suspect this is a problem with the duckdbn bindings.
    this.#prepare();
    if (!this.#prepared) throw new ReferenceError("SQL statement not set");
    return this.#prepared.query(...params);
  }
}

export const _internals = {
  readTextFile: Deno.readTextFile,
};
