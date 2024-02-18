import { assert, describe, it } from "vitest";

import {
  applyReplacement,
  applyReplacements,
} from "./apply-function-replacements";

describe("./utils/apply-function-replacements", () => {
  describe("#applyReplacement", () => {
    it("should delegate execution properly", () => {
      const self = {
        abc: "def",
      };

      class Target {
        public something = "KKona";

        public a(one: string, two: string, three: string): string {
          // test for the "this" reference in this class
          return this.something + one + two + three;
        }
      }

      const target = new Target();

      applyReplacement(
        self,
        target,
        "a",
        function a(
          originalFunction,
          one: string,
          two: string,
          three: string,
        ): string {
          // test for the "this" reference in the replacement function
          return originalFunction(one, two, three) + this.abc;
        },
      );

      assert.strictEqual(target.a("1", "2", "3"), "KKona123def");
    });

    it("should not create a enumerable property on the target object", () => {
      const self = {};
      class Target {
        public a(): string {
          return "a";
        }
      }

      const target = new Target();
      assert.deepStrictEqual(Object.keys(target), []);

      applyReplacement(self, target, "a", (originalFunction): string => {
        return originalFunction();
      });

      assert.deepStrictEqual(Object.keys(target), []);
    });
  });

  describe("#applyReplacements()", () => {
    it("should apply all replacements given in functions map", () => {
      const self = {
        abc: "def",
      };

      class Target {
        public a(): string {
          return "a";
        }
        public b(): string {
          return "b";
        }
        public c(): string {
          return "c";
        }
      }

      const target = new Target();

      applyReplacements(self, target, {
        a(originalFunction: () => string) {
          return `${originalFunction()}x`;
        },
        b(originalFunction: () => string) {
          return `${originalFunction()}y`;
        },
        c(originalFunction: () => string) {
          return `${originalFunction()}z`;
        },
      });

      assert.strictEqual(target.a(), "ax");
      assert.strictEqual(target.b(), "by");
      assert.strictEqual(target.c(), "cz");
    });
  });
});
