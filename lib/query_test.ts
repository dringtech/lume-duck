import { assertEquals, assertObjectMatch, assertThrows } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { assertSpyCallArg, resolvesNext, spy, stub } from "@std/testing/mock";
import { type Database, open } from "../deps/duckdb.ts";
import { _internals, Query } from "./query.ts";

describe("Query", () => {
  let query: Query;

  describe("#loadFile", () => {
    beforeEach(() => {
      query = new Query(open(":memory:"));
    });
    it("should load the SQL from the specified file", async () => {
      using stubReadFile = stub(
        _internals,
        "readTextFile",
        resolvesNext(["SELECT 1 AS number;"]),
      );
      await query.loadFile("FAKE SQL PATH");
      assertSpyCallArg(stubReadFile, 0, 0, "FAKE SQL PATH");
      const res = query.run();
      assertObjectMatch(res[0], { number: 1 });
    });
  });

  describe("#run", () => {
    beforeEach(() => {
      query = new Query(fakeDb);
    });

    it("should throw an error if called before setting SQL", () => {
      assertThrows(() => query.run());
    });

    it("should run simple queries", () => {
      query.sql = "FAKE SQL";
      using runSpy = spy(query, "run");
      const res = query.run();
      assertEquals(res, fakeResult);
      assertSpyCallArg(runSpy, 0, 0, undefined);
    });
  });

  describe("#run (actual queries)", () => {
    let db: Database;
    let query: Query;
    beforeEach(() => {
      db = open(":memory:");
      query = new Query(db);
    });

    afterEach(() => {
      db.close();
    });

    it("should run simple queries", () => {
      query.sql = "SELECT 1 AS number";
      const res = query.run();
      assertObjectMatch(res[0], { number: 1 });
    });

    it("should support autoincrementing parameters", () => {
      query.sql = "SELECT ?::INTEGER AS number;";
      const res = query.run(2);
      assertObjectMatch(res[0], { number: 2 });
    });

    it("should support multiple autoincrementing parameters", () => {
      query.sql = "SELECT ?::INTEGER AS number, ?::STRING AS string;";
      const res = query.run(3, "TEST");
      assertObjectMatch(res[0], { number: 3, string: "TEST" });
    });

    it("should support positional parameters", () => {
      query.sql = "SELECT $2::INTEGER AS number, $1::STRING AS string;";
      const res = query.run("TEST", 3);
      assertObjectMatch(res[0], { number: 3, string: "TEST" });
    });

    // it.skip("should support named parameters", () => {
    //   query.sql = "SELECT $n::INTEGER AS number, $s::STRING AS string;";
    //   const res = query.run({ n: "TEST", s: 4 });
    //   assertObjectMatch(res[0], { number: 4, string: "TEST" });
    // });

    describe("issues", () => {
      it("should return nulls (issue #1)", async () => {
        // Set up test table
        const conn = db.connect();
        conn.query(`
          CREATE TABLE test (v DOUBLE);
          INSERT INTO test (v) VALUES (1), (2), (NULL);
        `)
        conn.close();

        // Run test
        query.sql = 'SELECT * FROM test;'
        let res = query.run();
        assertEquals(res[0].v, 1);
        assertEquals(res[2].v, null);
        
        // Second time, it fails!
        res = query.run();
        assertEquals(res[0].v, 1);
        assertEquals(res[2].v, null);
      })
    })
  });

});

const fakeDb: Database = {
  connect() {
    return fakeConnection;
  },
  close() {
    return null;
  },
};

const fakeConnection = {
  query<T>(_s: string): T[] {
    return fakeResult as T[];
  },
  prepare(_s: string) {
    return fakePreparedStatement;
  },
  close() {},
};

const fakePreparedStatement = {
  query<T = Record<string, unknown>>(..._params: unknown[]): T[] {
    return fakeResult as T[];
  },
  close() {},
};

const fakeResult = [{ key: "value" }];
