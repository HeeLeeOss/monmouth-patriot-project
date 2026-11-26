import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { citationUrl, isListing, parseCoordinateText } from "../src/places";
import { placeSchema } from "../src/schemas";

const v = (text: string, value?: unknown, sourceIds = ["hmdb--m76469"], grade = "lead") => ({
  text,
  ...(value === undefined ? {} : { value }),
  sourceIds,
  grade,
});
const one = (text: string, value?: unknown, sourceIds?: string[], grade?: string) => ({
  variants: [v(text, value, sourceIds, grade)],
});

const marker = {
  id: "capt-joshua-huddy-marker-colts-neck",
  type: "marker",
  historicName: one("Capt. Joshua Huddy"),
  modernName: one("Capt. Joshua Huddy"),
  validFrom: one("August 27, 1977", "1977-08-27"),
  validTo: null,
  coordinates: one("40° 18.691′ N, 74° 11.364′ W", { lat: 40.311517, lon: -74.189400 }, ["hmdb--m76469"], "probable"),
  honoree: one("Capt. Joshua Huddy", "Joshua Huddy", ["hmdb--m76469"], "lead"),
  accuracy: "unverified",
  sourceIds: ["hmdb--m76469"],
  summary: "A memorial marker to Joshua Huddy in Memorial Park on Heyers Mill Road, Colts Neck.",
};

const issues = (r: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  r.success ? [] : r.error!.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
const without = (key: string) => {
  const copy: Record<string, unknown> = { ...marker };
  delete copy[key];
  return copy;
};

describe("namesake place records (AC-13)", () => {
  it("accepts a marker with its listing, name, type, coordinates, honoree and accuracy", () => {
    expect(issues(placeSchema.safeParse(marker))).toEqual([]);
  });

  it.each(["coordinates", "honoree", "accuracy", "sourceIds", "summary"])("a namesake requires %s", (key) => {
    expect(issues(placeSchema.safeParse(without(key)))).toEqual([`${key}: a namesake needs ${key}`]);
  });

  it("treats any place with an honoree as a namesake, whatever its type", () => {
    const road = { ...marker, id: "huddy-road", type: "road" };
    expect(placeSchema.safeParse(road).success).toBe(true);
    const r = road as Record<string, unknown>;
    delete r.accuracy;
    expect(placeSchema.safeParse(r).success).toBe(false);
  });

  it("does not demand namesake fields of a historic place with no honoree", () => {
    const township = {
      id: "middletown-township",
      type: "township",
      historicName: one("Middletown Township"),
      modernName: one("Middletown Township"),
      validFrom: one("1693", "1693"),
      validTo: null,
    };
    expect(issues(placeSchema.safeParse(township))).toEqual([]);
  });

  it("requires the listing to be a GNIS feature or an HMDB marker page, not the collection", () => {
    for (const ids of [["hmdb"], ["usgs-gnis"], ["stryker-1872--p3"], ["hmdb--76469"], ["usgs-gnis--881132"]])
      expect(placeSchema.safeParse({ ...marker, sourceIds: ids }).success, ids.join()).toBe(false);
    for (const ids of [["usgs-gnis--f881132"], ["hmdb--m53132", "hmdb--m312459"]])
      expect(placeSchema.safeParse({ ...marker, sourceIds: ids }).success, ids.join()).toBe(true);
  });

  it("keeps a marker's or a name's honoree a lead: never graded stronger on GNIS or HMDB alone", () => {
    const strong = { ...marker, honoree: one("Capt. Joshua Huddy", undefined, ["hmdb--m76469"], "probable") };
    expect(placeSchema.safeParse(strong).success).toBe(false);
    const backed = { ...marker, honoree: one("Capt. Joshua Huddy", undefined, ["hmdb--m76469", "nara-m804--s1"], "probable") };
    expect(placeSchema.safeParse(backed).success).toBe(true);
  });

  it.each([
    [["hmdb--m76469", "hmdb"], "probable"],
    [["hmdb--m76469-photo"], "probable"],
    [["usgs-gnis--history"], "proved"],
    [["usgs-gnis--f881132", "hmdb--m5657"], "probable"],
  ])("counts any HMDB or GNIS citation as marker-or-name evidence: %j graded %s is refused", (ids, grade) => {
    expect(placeSchema.safeParse({ ...marker, honoree: one("Capt. Joshua Huddy", undefined, ids, grade) }).success).toBe(false);
  });

  it.each(["historicName", "modernName", "validFrom", "namedOn"])(
    "grades %s read only from HMDB as a lead, like everything else a marker says",
    (key) => {
      const field = key === "validFrom" || key === "namedOn" ? one("1977", "1977", ["hmdb--m76469"], "probable") : one("Capt. Joshua Huddy", undefined, ["hmdb--m76469"], "probable");
      expect(placeSchema.safeParse({ ...marker, [key]: field }).success).toBe(false);
    },
  );

  it("lets HMDB coordinates be probable: a contributor's position fix is not a marker's claim", () => {
    expect(issues(placeSchema.safeParse(marker))).toEqual([]);
  });

  it("grades a GNIS name proved as the current name but not as a historic name", () => {
    const gnis = ["usgs-gnis--f881132"];
    const settlement = {
      ...marker,
      id: "tennent",
      type: "settlement",
      historicName: one("Tennent", undefined, gnis, "lead"),
      modernName: one("Tennent", undefined, gnis, "proved"),
      validFrom: null,
      coordinates: one("401646N 0742004W", { lat: 40.2795546, lon: -74.3343145 }, gnis, "probable"),
      honoree: one("Tennent", "Tennent", gnis, "lead"),
      sourceIds: gnis,
    };
    expect(issues(placeSchema.safeParse(settlement))).toEqual([]);
    expect(placeSchema.safeParse({ ...settlement, historicName: one("Tennent", undefined, gnis, "proved") }).success).toBe(false);
  });

  it("refuses who-erected-it text quoted from HMDB: marker text comes only from our own reading", () => {
    expect(placeSchema.safeParse({ ...marker, namedBy: one("the citizens of Colts Neck") }).success).toBe(false);
    const ours = { ...marker, namedBy: one("the citizens of Colts Neck", undefined, ["photo-2027-huddy-colts-neck"], "lead") };
    expect(issues(placeSchema.safeParse(ours))).toEqual([]);
  });

  it("accepts only the five accuracy verdicts", () => {
    expect(placeSchema.safeParse({ ...marker, accuracy: "wrong" }).success).toBe(false);
  });

  it("refuses an accuracy verdict without the person who audited it and the date", () => {
    expect(placeSchema.safeParse({ ...marker, accuracy: "accurate" }).success).toBe(false);
    expect(placeSchema.safeParse({ ...marker, accuracy: "accurate", auditedBy: "A Reviewer" }).success).toBe(false);
    const audited = { ...marker, accuracy: "minor error", auditedBy: "A Reviewer", auditedOn: "2027-03-01" };
    expect(issues(placeSchema.safeParse(audited))).toEqual([]);
    expect(placeSchema.safeParse({ ...marker, auditedBy: "A Reviewer", auditedOn: "2027-03-01" }).success).toBe(false);
  });

  it("dates an audit to the day", () => {
    expect(placeSchema.safeParse({ ...marker, accuracy: "accurate", auditedBy: "A Reviewer", auditedOn: "2027" }).success).toBe(false);
  });

  it("has nowhere to put copied marker text or a rehosted photograph", () => {
    for (const key of ["inscription", "transcription", "markerText", "photo", "image"])
      expect(placeSchema.safeParse({ ...marker, [key]: "x" }).success, key).toBe(false);
  });

  it("has nowhere to hide copied text inside a sourced field either", () => {
    const inVariant = { variants: [{ ...v("Capt. Joshua Huddy"), inscription: "In tribute to…" }] };
    expect(placeSchema.safeParse({ ...marker, historicName: inVariant }).success).toBe(false);
    const inField = { ...one("Capt. Joshua Huddy"), inscription: "In tribute to…" };
    expect(placeSchema.safeParse({ ...marker, modernName: inField }).success).toBe(false);
  });

  it("caps a place field's text at a name's length, so it cannot carry an inscription", () => {
    const long = one("x".repeat(201));
    expect(placeSchema.safeParse({ ...marker, modernName: long }).success).toBe(false);
  });

  it("records who named it and when, if known, as sourced fields", () => {
    const named = { ...marker, namedOn: one("August 27, 1977", "1977-08-27") };
    expect(issues(placeSchema.safeParse(named))).toEqual([]);
    expect(placeSchema.safeParse({ ...marker, namedBy: "the citizens of Colts Neck" }).success).toBe(false);
  });

  it("allows validFrom to be null on a namesake no source dates yet, but never missing", () => {
    expect(issues(placeSchema.safeParse({ ...marker, validFrom: null }))).toEqual([]);
    expect(placeSchema.safeParse(without("validFrom")).success).toBe(false);
  });

  it("still requires a historic place without an honoree to be dated (AC-03)", () => {
    const township = {
      id: "middletown-township",
      type: "township",
      historicName: one("Middletown Township", undefined, ["nj-deeds--b1"], "probable"),
      modernName: one("Middletown Township", undefined, ["nj-deeds--b1"], "probable"),
      validFrom: null,
      validTo: null,
    };
    expect(issues(placeSchema.safeParse(township))).toEqual(["validFrom: a place without an honoree must be dated"]);
  });
});

describe("listing citations", () => {
  it("recognises a GNIS feature or an HMDB marker", () => {
    expect(["usgs-gnis--f881132", "hmdb--m5657"].every(isListing)).toBe(true);
    expect(["hmdb", "usgs-gnis", "hmdb--m", "hmdb--m12a", "usgs-gnis--f", "nara-m804--s1"].some(isListing)).toBe(false);
  });

  it("links each citation to the page that was read", () => {
    expect(citationUrl("hmdb--m76469")).toBe("https://www.hmdb.org/m.asp?m=76469");
    expect(citationUrl("usgs-gnis--f881132")).toBe(
      "https://edits.nationalmap.gov/apps/gaz-domestic/public/summary/881132",
    );
    expect(citationUrl("stryker-1872--p3")).toBeUndefined();
  });
});

describe("coordinate text", () => {
  it("reads HMDB degrees and decimal minutes", () => {
    const c = parseCoordinateText("40° 18.691′ N, 74° 11.364′ W")!;
    expect(c.lat).toBeCloseTo(40.311517, 5);
    expect(c.lon).toBeCloseTo(-74.1894, 5);
  });

  it("reads GNIS packed degrees, minutes and seconds", () => {
    const c = parseCoordinateText("401646N 0742004W")!;
    expect(c.lat).toBeCloseTo(40.279444, 5);
    expect(c.lon).toBeCloseTo(-74.334444, 5);
  });

  it("returns undefined for text it cannot read", () => {
    expect(parseCoordinateText("near the bandstand")).toBeUndefined();
  });
});

describe("the first namesake inventory (AC-13)", () => {
  const dir = "src/content/places";
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  const records = files.map((f) => ({ file: f, data: JSON.parse(readFileSync(join(dir, f), "utf8")) }));
  const namesakes = records.filter((r) => r.data.honoree !== undefined);

  it("has entries from both GNIS and HMDB", () => {
    const ids = namesakes.flatMap((r) => r.data.sourceIds as string[]);
    expect(ids.some((s) => s.startsWith("usgs-gnis--f"))).toBe(true);
    expect(ids.some((s) => s.startsWith("hmdb--m"))).toBe(true);
  });

  it.each(records.map((r) => [r.file, r.data] as const))("%s is a valid place named by its id", (file, data) => {
    expect(issues(placeSchema.safeParse(data))).toEqual([]);
    expect(file).toBe(`${data.id}.json`);
  });

  it("leaves every accuracy unverified until a person audits it", () => {
    expect(namesakes.length).toBeGreaterThan(0);
    for (const r of namesakes) expect(r.data.accuracy, r.file).toBe("unverified");
  });

  it("parses every coordinate text to within one second of arc of the value stored with it", () => {
    for (const r of records)
      for (const variant of r.data.coordinates?.variants ?? []) {
        const read = parseCoordinateText(variant.text);
        expect(read, `${r.file}: ${variant.text}`).toBeDefined();
        expect(Math.abs(read!.lat - variant.value.lat), r.file).toBeLessThan(1 / 3600);
        expect(Math.abs(read!.lon - variant.value.lon), r.file).toBeLessThan(1 / 3600);
      }
  });

  it("places every entry near Monmouth County (a bounding box, not the county line)", () => {
    for (const r of records)
      for (const variant of r.data.coordinates?.variants ?? []) {
        expect(variant.value.lat, r.file).toBeGreaterThan(40.05);
        expect(variant.value.lat, r.file).toBeLessThan(40.5);
        expect(variant.value.lon, r.file).toBeGreaterThan(-74.65);
        expect(variant.value.lon, r.file).toBeLessThan(-73.95);
      }
  });

  it("enters the plan's seed candidates: Huddy, Molly Pitcher, the Battle Monument and Old Tennent", () => {
    const honorees = namesakes
      .flatMap((r) => (r.data.honoree.variants as { text: string; value?: string }[]).map((x) => `${x.text} / ${x.value}`))
      .join(" | ");
    for (const name of ["Huddy", "Molly Pitcher", "Battle of Monmouth", "Tennent"]) expect(honorees).toContain(name);
  });

  it("keeps the record's exact text, and puts the honoree we read from it in the value", () => {
    for (const r of namesakes)
      for (const x of r.data.honoree.variants as { text: string; value?: string }[]) {
        expect(x.value, `${r.file}: honoree value`).toBeTruthy();
        expect(r.data.modernName.variants.some((n: { text: string }) => n.text === x.text), `${r.file}: honoree text is the name as listed`).toBe(true);
      }
  });

  it("no summary quotes a passage of more than four words (paraphrase is checked by review, not here)", () => {
    for (const r of records) {
      const quotes = String(r.data.summary ?? "").match(/["“][^"”]*["”]/g) ?? [];
      for (const q of quotes) expect(q.split(/\s+/).length, `${r.file}: ${q}`).toBeLessThanOrEqual(4);
    }
  });

  it("rehosts no photographs: the places folder holds only JSON records", () => {
    const other = readdirSync(dir).filter((f) => extname(f) !== ".json" && f !== ".gitkeep");
    expect(other).toEqual([]);
  });
});
