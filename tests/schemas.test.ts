import { describe, expect, it } from "vitest";
import { z } from "astro/zod";
import { GRADES, patriotSchema, personId, placeSchema, sourced } from "../src/schemas";

const variant = (text: string, value: string, sourceIds = ["stryker-1872-p123"], grade = "probable") => ({
  text,
  value,
  sourceIds,
  grade,
});

describe("sourced fields (AC-02)", () => {
  const field = sourced(z.string());

  it("accepts a single variant with no preferred pointer", () => {
    expect(field.safeParse({ variants: [variant("abt. 1745", "1745")] }).success).toBe(true);
  });

  it("accepts agreeing variants without a rationale", () => {
    const r = field.safeParse({ variants: [variant("1745", "1745"), variant("1745", "1745", ["nara-m804-x"])] });
    expect(r.success).toBe(true);
  });

  it("rejects a preferred variant without a rationale when variants disagree", () => {
    const r = field.safeParse({
      variants: [variant("1745", "1745"), variant("1746", "1746", ["nara-m804-x"])],
      preferred: 0,
    });
    expect(r.success).toBe(false);
  });

  it("rejects disagreeing variants that name no preferred variant", () => {
    const r = field.safeParse({
      variants: [variant("1745", "1745"), variant("1746", "1746", ["nara-m804-x"])],
      rationale: "The baptism record is earlier.",
    });
    expect(r.success).toBe(false);
  });

  it("accepts disagreeing variants with a preferred pointer and a rationale", () => {
    const r = field.safeParse({
      variants: [variant("1745", "1745"), variant("1746", "1746", ["nara-m804-x"])],
      preferred: 0,
      rationale: "The register was compiled from the muster roll; the pension gives age only.",
    });
    expect(r.success).toBe(true);
  });

  it("rejects a preferred pointer outside the variants", () => {
    expect(field.safeParse({ variants: [variant("1745", "1745")], preferred: 1 }).success).toBe(false);
  });

  it("rejects a variant with no source", () => {
    expect(field.safeParse({ variants: [variant("1745", "1745", [])] }).success).toBe(false);
  });

  it("rejects a grade outside the six evidence grades", () => {
    expect(GRADES).toEqual(["proved", "probable", "possible", "lead", "unsupported", "disproved"]);
    expect(field.safeParse({ variants: [variant("1745", "1745", ["s"], "certain")] }).success).toBe(false);
  });
});

describe("person ids (AC-03)", () => {
  it.each(["huddy-joshua-1735", "van-cortlandt-philip-1749", "holmes-asher-1740"])("accepts %s", (id) => {
    expect(personId.safeParse(id).success).toBe(true);
  });

  it.each(["Huddy-Joshua-1735", "huddy-1735", "huddy-joshua", "huddy_joshua_1735", "huddy-joshua-35", "huddy-joshua-1735-"])(
    "rejects %s",
    (id) => {
      expect(personId.safeParse(id).success).toBe(false);
    },
  );

  it("is enforced on a patriot record", () => {
    const base = { name: "Joshua Huddy", status: "lead" };
    expect(patriotSchema.safeParse({ ...base, id: "huddy-joshua-1735" }).success).toBe(true);
    expect(patriotSchema.safeParse({ ...base, id: "Joshua Huddy" }).success).toBe(false);
  });
});

describe("dated places (AC-03)", () => {
  const place = {
    id: "middletown-township",
    type: "township",
    historicName: "Middletown Township",
    modernName: "Middletown Township",
    validFrom: "1693",
    validTo: null,
  };

  it("accepts a place with historic and modern names and a date range", () => {
    expect(placeSchema.safeParse(place).success).toBe(true);
  });

  it.each(["historicName", "modernName", "validFrom", "validTo"])("requires %s", (key) => {
    const copy: Record<string, unknown> = { ...place };
    delete copy[key];
    expect(placeSchema.safeParse(copy).success).toBe(false);
  });

  it("accepts dated parent places", () => {
    const r = placeSchema.safeParse({ ...place, parents: [{ placeId: "monmouth-county", from: "1693", to: null }] });
    expect(r.success).toBe(true);
  });
});
