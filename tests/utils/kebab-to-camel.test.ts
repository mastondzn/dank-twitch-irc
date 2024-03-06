import { describe, expect, it } from "vitest";

import { kebabToCamelCase } from "~/utils/kebab-to-camel";

describe("kebabToCamelCase", () => {
  it("converts kebab-case to camelCase", () => {
    expect(kebabToCamelCase("emote-only")).toBe("emoteOnly");
    expect(kebabToCamelCase("followers-only")).toBe("followersOnly");
    expect(kebabToCamelCase("followers-only-duration")).toBe(
      "followersOnlyDuration",
    );
    expect(kebabToCamelCase("followers-only-duration-raw")).toBe(
      "followersOnlyDurationRaw",
    );
    expect(kebabToCamelCase("r9k")).toBe("r9k");
    expect(kebabToCamelCase("r9k-raw")).toBe("r9kRaw");
    expect(kebabToCamelCase("slow-mode-duration")).toBe("slowModeDuration");
    expect(kebabToCamelCase("slow-mode-duration-raw")).toBe(
      "slowModeDurationRaw",
    );
    expect(kebabToCamelCase("subscribers-only")).toBe("subscribersOnly");
    expect(kebabToCamelCase("subscribers-only-raw")).toBe("subscribersOnlyRaw");
  });
});
