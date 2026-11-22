import { describe, expect, it } from "vitest";
import { z } from "astro/zod";
import {
  GRADES,
  engagementSchema,
  idPart,
  partialDate,
  patriotSchema,
  personId,
  personSchema,
  placeSchema,
  sourced,
  unitSchema,
} from "../src/schemas";

type Variant = { text: string; value?: unknown; sourceIds: string[]; grade: string };
const v = (text: string, value?: unknown, sourceIds = ["stryker-1872-p123"], grade = "probable"): Variant => ({
  text,
  ...(value === undefined ? {} : { value }),
  sourceIds,
  grade,
});
/** A one-variant sourced field. */
const one = (text: string, value?: unknown) => ({ variants: [v(text, value)] });

const issues = (r: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  r.success ? [] : r.error!.issues.map((i) => `${i.path.join(".")}: ${i.message}`);

describe("sourced fields (AC-02)", () => {
  const field = sourced(z.string());

  it("accepts a single variant with no preferred pointer", () => {
    expect(field.safeParse({ variants: [v("abt. 1745", "1745")] }).success).toBe(true);
  });

  it("accepts agreeing variants without a rationale", () => {
    expect(field.safeParse({ variants: [v("1745", "1745"), v("1745", "1745", ["nara-m804-x"])] }).success).toBe(true);
  });

  it("treats a parsed and an unparsed variant with the same text as agreeing", () => {
    expect(field.safeParse({ variants: [v("abt. 1745", "1745"), v("abt. 1745", undefined, ["s2"])] }).success).toBe(true);
  });

  it("treats the same parsed value written two ways as agreeing", () => {
    expect(field.safeParse({ variants: [v("1745", "1745"), v("abt. 1745", "1745", ["s2"])] }).success).toBe(true);
  });

  it("rejects a preferred variant without a rationale when variants disagree", () => {
    const r = field.safeParse({ variants: [v("1745", "1745"), v("1746", "1746", ["s2"])], preferred: 0 });
    expect(issues(r)).toEqual(["rationale: variants disagree: give a sourced rationale"]);
  });

  it("rejects disagreeing variants that name no preferred variant", () => {
    const r = field.safeParse({ variants: [v("1745", "1745"), v("1746", "1746", ["s2"])], rationale: "Earlier record." });
    expect(issues(r)).toEqual(["preferred: variants disagree: name the preferred variant"]);
  });

  it("rejects a blank rationale", () => {
    const r = field.safeParse({ variants: [v("1745", "1745"), v("1746", "1746", ["s2"])], preferred: 0, rationale: "  " });
    expect(r.success).toBe(false);
  });

  it("accepts disagreeing variants with a preferred pointer and a rationale", () => {
    const r = field.safeParse({
      variants: [v("1745", "1745"), v("1746", "1746", ["s2"])],
      preferred: 0,
      rationale: "The register was compiled from the muster roll; the pension gives age only.",
    });
    expect(r.success).toBe(true);
  });

  it("rejects a preferred pointer outside the variants", () => {
    expect(issues(field.safeParse({ variants: [v("1745", "1745")], preferred: 1 }))).toEqual([
      "preferred: preferred must point at one of the variants",
    ]);
  });

  it("rejects a preferred variant graded disproved", () => {
    const r = field.safeParse({
      variants: [v("1745", "1745", ["s1"], "disproved"), v("1746", "1746", ["s2"])],
      preferred: 0,
      rationale: "x",
    });
    expect(issues(r)).toEqual(["preferred: the preferred variant cannot be disproved"]);
  });

  it("rejects a variant with no source", () => {
    expect(field.safeParse({ variants: [v("1745", "1745", [])] }).success).toBe(false);
  });

  it("rejects a grade outside the six evidence grades", () => {
    expect(GRADES).toEqual(["proved", "probable", "possible", "lead", "unsupported", "disproved"]);
    expect(field.safeParse({ variants: [v("1745", "1745", ["s"], "certain")] }).success).toBe(false);
  });

  it("applies inside a record: a patriot's disagreeing birth dates need a rationale", () => {
    const base = { id: "huddy-joshua-1735", name: one("Joshua Huddy"), status: "lead" };
    const born = { variants: [v("1735", "1735"), v("1736", "1736", ["s2"])], preferred: 0 };
    expect(issues(patriotSchema.safeParse({ ...base, born }))).toEqual([
      "born.rationale: variants disagree: give a sourced rationale",
    ]);
  });

  it.each([
    ["patriot name", () => patriotSchema.safeParse({ id: "huddy-joshua-1735", name: "Joshua Huddy", status: "lead" })],
    ["person role", () => personSchema.safeParse({ id: "tye-colonel-1753", name: one("Colonel Tye"), role: "context" })],
    ["unit name", () => unitSchema.safeParse({ id: "monmouth-1st", name: "1st Regiment", kind: one("militia", "militia"), state: one("NJ") })],
    ["engagement date", () => engagementSchema.safeParse({ title: "Battle of Monmouth", date: "1778-06-28", place: one("Freehold", "freehold") })],
  ])("requires a sourced value, not a plain one: %s", (_label, parse) => {
    expect(parse().success).toBe(false);
  });
});

describe("dates", () => {
  it.each(["1778", "1778-06", "1778-06-28"])("accepts %s", (d) => expect(partialDate.safeParse(d).success).toBe(true));
  it.each(["1778-13", "1778-06-32", "1778-00-01", "78", "1778/06/28"])("rejects %s", (d) =>
    expect(partialDate.safeParse(d).success).toBe(false),
  );
});

describe("person ids (AC-03)", () => {
  it.each(["huddy-joshua-1735", "van-cortlandt-philip-1749", "obrien-john-1750", "smith-john-1745-2", "smith-john-xxxx"])(
    "accepts %s",
    (id) => expect(personId.safeParse(id).success).toBe(true),
  );

  it.each([
    "Huddy-Joshua-1735",
    "huddy-1735",
    "huddy-joshua",
    "huddy_joshua_1735",
    "huddy-joshua-35",
    "huddy-joshua-1735-",
    "smith-john-0000",
    "smith-john-1745-1",
    "o'brien-john-1750",
  ])("rejects %s", (id) => expect(personId.safeParse(id).success).toBe(false));

  it.each([
    ["O'Brien", "obrien"],
    ["Müller", "muller"],
    ["Van Cortlandt", "van-cortlandt"],
    ["  Covenhoven ", "covenhoven"],
  ])("folds %s to %s", (name, part) => expect(idPart(name)).toBe(part));

  it("is enforced on a patriot record", () => {
    const base = { name: one("Joshua Huddy"), status: "lead" };
    expect(patriotSchema.safeParse({ ...base, id: "huddy-joshua-1735" }).success).toBe(true);
    expect(patriotSchema.safeParse({ ...base, id: "Joshua Huddy" }).success).toBe(false);
  });
});

describe("dated places (AC-03)", () => {
  const place = {
    id: "middletown-township",
    type: "township",
    historicName: one("Middletown Township"),
    modernName: one("Middletown Township"),
    validFrom: one("1693", "1693"),
    validTo: null,
  };

  it("accepts a place with historic and modern names and a date range", () => {
    expect(issues(placeSchema.safeParse(place))).toEqual([]);
  });

  it.each(["historicName", "modernName", "validFrom", "validTo"])("requires %s", (key) => {
    const copy: Record<string, unknown> = { ...place };
    delete copy[key];
    expect(placeSchema.safeParse(copy).success).toBe(false);
  });

  it("accepts dated parent places", () => {
    const parents = [{ placeId: one("monmouth-county", "monmouth-county"), from: one("1693", "1693"), to: null }];
    expect(issues(placeSchema.safeParse({ ...place, parents }))).toEqual([]);
  });
});
