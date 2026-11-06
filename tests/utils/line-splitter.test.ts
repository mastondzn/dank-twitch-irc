import { describe, expect, it } from "vitest";

import { LineSplitter } from "~/utils/line-splitter";

describe("./utils/line-splitter", () => {
  describe("lineSplitter", () => {
    it("should split multiple CRLF-terminated lines in one chunk", () => {
      const splitter = new LineSplitter();

      expect(splitter.push("PING :a\r\nPONG :b\r\n")).toEqual([
        "PING :a",
        "PONG :b",
      ]);
    });

    it("should split LF-terminated lines", () => {
      const splitter = new LineSplitter();

      expect(splitter.push("PING :a\nPONG :b\n")).toEqual([
        "PING :a",
        "PONG :b",
      ]);
    });

    it("should keep incomplete lines buffered until the terminator arrives", () => {
      const splitter = new LineSplitter();

      expect(splitter.push("PING :a")).toEqual([]);
      expect(splitter.push("\r\nPONG")).toEqual(["PING :a"]);
      expect(splitter.push(" :b\r\n")).toEqual(["PONG :b"]);
    });

    it("should handle a CRLF pair split across chunks", () => {
      const splitter = new LineSplitter();

      expect(splitter.push("PING :a\r")).toEqual([]);
      expect(splitter.push("\nPONG :b\r\n")).toEqual(["PING :a", "PONG :b"]);
    });

    it("should flush a trailing line without a terminator", () => {
      const splitter = new LineSplitter();

      expect(splitter.push("PING :a\r\nPONG :b")).toEqual(["PING :a"]);
      expect(splitter.flush()).toEqual(["PONG :b"]);
      expect(splitter.flush()).toEqual([]);
    });

    it("should not emit an empty trailing line", () => {
      const splitter = new LineSplitter();

      expect(splitter.push("PING :a\r\n")).toEqual(["PING :a"]);
      expect(splitter.flush()).toEqual([]);
    });
  });
});
