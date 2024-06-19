import { beforeEach, describe, it } from "@std/testing/bdd";
import { _internals, duckDbLoader, type Loader } from "./loader.ts";
import {
  assertSpyCall,
  assertSpyCallArg,
  returnsNext,
  stub,
} from "@std/testing/mock";
import { assertEquals } from "@std/assert";

describe("duckDbLoader factory", () => {
  describe("options handling", () => {
    it("should default to an in-memory database", () => {
      using openStub = stub(_internals, "open");
      duckDbLoader();
      assertSpyCallArg(openStub, 0, 0, ":memory:");
    });
    it("should be possible to override the database path", () => {
      using openStub = stub(_internals, "open");
      duckDbLoader({ dbPath: "FAKE PATH" });
      assertSpyCallArg(openStub, 0, 0, "FAKE PATH");
    });
  });
});

describe("duckDbLoader loader", () => {
  let loader: Loader;
  const fakeQuery = {
    async loadFile() {},
    run<T>(): T[] {
      return [];
    },
    get sql() {
      return "FAKE SQL";
    },
  };

  beforeEach(() => {
    using _openStub = stub(_internals, "open");
    loader = duckDbLoader();
  });
  it("should load sql", async () => {
    using loadFileStub = stub(fakeQuery, "loadFile");
    using queryStub = stub(_internals, "Query", returnsNext([fakeQuery]));
    const fn = await loader("FAKE PATH");
    assertSpyCall(queryStub, 0);
    assertSpyCallArg(loadFileStub, 0, 0, "FAKE PATH");
    assertEquals(typeof fn, "function");
  });

  it("should pass params down", async () => {
    using _loadFileStub = stub(fakeQuery, "loadFile");
    using runStub = stub(fakeQuery, "run");
    using _queryStub = stub(_internals, "Query", returnsNext([fakeQuery]));
    const fn = await loader("FAKE PATH");
    fn("FAKE PARAMS");
    assertSpyCallArg(runStub, 0, 0, "FAKE PARAMS");
  });

  it("should return the sql string if called as a string", async () => {
    // using _loadFileStub = stub(fakeQuery, "loadFile");
    using _queryStub = stub(_internals, "Query", returnsNext([fakeQuery]));
    const fn = await loader("FAKE PATH");
    assertEquals(fn.toString(), "FAKE SQL");
    assertEquals(`${fn}`, "FAKE SQL");
  });
});
