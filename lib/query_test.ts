import { assertEquals, assertObjectMatch, assertThrows } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
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
      query.sql = "FAKE SQL";
    });

    it("should throw an error if called before setting SQL", () => {
      query = new Query(fakeDb);
      assertThrows(() => query.run());
    });

    it("should run simple queries", () => {
      using runSpy = spy(query, "run");
      const res = query.run();
      assertEquals(res, fakeResult);
      assertSpyCallArg(runSpy, 0, 0, undefined);
    });
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
};

const fakeResult = [{ key: "value" }];
