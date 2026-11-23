import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { allowlistSchema, entrySchema, parseAllowlist } from "../src/allowlist";
import { checkSources } from "../scripts/check-sources";

const real = parseAllowlist(readFileSync("sources/allowlist.yml", "utf8"));
const byId = Object.fromEntries(real.map((e) => [e.id, e]));

const entry = (over: Record<string, unknown> = {}) => ({
  id: "stryker-1872",
  title: "Official Register of the Officers and Men of New Jersey in the Revolutionary War",
  custodian: "Internet Archive",
  url: "https://archive.org/details/officialregister00newjuoft",
  format: "scanned book (PDF, page images, OCR text)",
  rights: { basis: "expired-copyright", copy: "Internet Archive scan", analysis: "Published 1872; the scan adds nothing." },
  extraction: { method: "ocr-print", accuracyBaseline: "Every OCR row checked by a person against the page image." },
  status: "pending",
  ...over,
});

describe("allow-list schema (AC-05)", () => {
  it("accepts a pending entry with every required field", () => {
    expect(entrySchema.safeParse(entry()).success).toBe(true);
  });

  it.each(["title", "custodian", "url", "format", "rights", "extraction", "status"])("requires %s", (key) => {
    const e: Record<string, unknown> = entry();
    delete e[key];
    expect(entrySchema.safeParse(e).success).toBe(false);
  });

  it("requires the rights basis to name the specific copy or edition", () => {
    expect(entrySchema.safeParse(entry({ rights: { basis: "expired-copyright", analysis: "old" } })).success).toBe(false);
  });

  it("requires an accuracy baseline for the extraction method", () => {
    expect(entrySchema.safeParse(entry({ extraction: { method: "ocr-print" } })).success).toBe(false);
  });

  it("allows only approved, pending or rejected", () => {
    expect(entrySchema.safeParse(entry({ status: "maybe" })).success).toBe(false);
  });

  it("requires a reviewer and a date on an approved or rejected entry", () => {
    expect(entrySchema.safeParse(entry({ status: "approved" })).success).toBe(false);
    expect(entrySchema.safeParse(entry({ status: "approved", reviewer: "A Reviewer" })).success).toBe(false);
    expect(entrySchema.safeParse(entry({ status: "approved", reviewer: "A Reviewer", decidedOn: "2027-01-05" })).success).toBe(true);
  });

  it("accepts a rejection decided by project policy, naming the policy, instead of a reviewer", () => {
    expect(entrySchema.safeParse(entry({ status: "rejected", policy: "Task X AC-07", decidedOn: "2026-11-22" })).success).toBe(true);
    expect(entrySchema.safeParse(entry({ status: "rejected", decidedOn: "2026-11-22" })).success).toBe(false);
  });

  it("never lets project policy approve a source: approval is the rights reviewer's", () => {
    expect(entrySchema.safeParse(entry({ status: "approved", policy: "Task X", decidedOn: "2026-11-22" })).success).toBe(false);
  });

  it("refuses a decision recorded on a pending entry", () => {
    expect(entrySchema.safeParse(entry({ reviewer: "A Reviewer", decidedOn: "2027-01-05" })).success).toBe(false);
  });

  it("refuses duplicate ids in the list", () => {
    expect(allowlistSchema.safeParse({ sources: [entry(), entry()] }).success).toBe(false);
  });

  it("parses the real sources/allowlist.yml", () => {
    expect(real.length).toBeGreaterThan(0);
  });
});

describe("rejected sources (AC-07)", () => {
  const rejected = ["ancestry", "fold3", "familysearch", "newspapers-com", "find-a-grave", "sar-prs", "dar-grs"];

  it.each(rejected)("%s has a rejected entry with its reason", (id) => {
    expect(byId[id]?.status).toBe("rejected");
    expect(byId[id]?.policy).toMatch(/AC-07/);
    expect(byId[id]?.reviewer).toBeUndefined();
    expect(byId[id]?.rights.analysis.length).toBeGreaterThan(20);
  });

  it("the policy names each rejected source and the lead-lookup rule", () => {
    const policy = readFileSync("docs/sources-policy.md", "utf8");
    for (const name of ["Ancestry", "Fold3", "FamilySearch", "Newspapers.com", "Find a Grave", "SAR Patriot Research System", "DAR GRS"])
      expect(policy).toContain(name);
    expect(policy).toMatch(/lead-lookup rule/i);
  });
});

describe("the four first sources (AC-08)", () => {
  it.each(["stryker-1872", "nara-m804", "usgs-gnis", "hmdb"])("%s is analysed", (id) => {
    expect(byId[id], id).toBeDefined();
    expect(byId[id]!.rights.analysis.length).toBeGreaterThan(80);
  });

  it.each(["stryker-1872", "nara-m804", "usgs-gnis", "hmdb"])("%s is left pending for the rights reviewer", (id) => {
    expect(byId[id]!.status).toBe("pending");
    expect(byId[id]!.reviewer).toBeUndefined();
  });
});

describe("source check (AC-06)", () => {
  let dir = "";
  afterEach(() => dir && rmSync(dir, { recursive: true, force: true }));

  const repo = (allowlist: object[], files: Record<string, string>) => {
    dir = mkdtempSync(join(tmpdir(), "mpp-sources-"));
    mkdirSync(join(dir, "sources"));
    writeFileSync(join(dir, "sources", "allowlist.yml"), JSON.stringify({ sources: allowlist }));
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(join(dir, path, ".."), { recursive: true });
      writeFileSync(join(dir, path), text);
    }
    return dir;
  };
  const approved = entry({ status: "approved", reviewer: "A Reviewer", decidedOn: "2027-01-05" });
  const place = (sourceIds: string[]) =>
    JSON.stringify({ id: "huddy-park", historicName: { variants: [{ text: "Huddy Park", sourceIds, grade: "proved" }] } });

  it("fails on a content file that cites a pending source", () => {
    const root = repo([entry()], { "src/content/places/huddy-park.json": place(["stryker-1872--p10"]) });
    const problems = checkSources(root);
    expect(problems).toEqual([
      { file: "src/content/places/huddy-park.json", sourceId: "stryker-1872--p10", reason: "source stryker-1872 is pending" },
    ]);
  });

  it("passes when every cited source belongs to an approved entry", () => {
    const root = repo([approved], { "src/content/places/huddy-park.json": place(["stryker-1872--p10", "stryker-1872"]) });
    expect(checkSources(root)).toEqual([]);
  });

  it("fails on a source the list does not have", () => {
    const root = repo([approved], { "src/content/places/huddy-park.json": place(["hmdb--12345"]) });
    expect(checkSources(root)[0]?.reason).toBe("source hmdb--12345 is not on the allow-list");
  });

  it("checks MDX frontmatter and roster rows too", () => {
    const root = repo([entry()], {
      "src/content/patriots/a.mdx": "---\nid: smith-john-1745\nname:\n  variants:\n    - text: John Smith\n      sourceIds: [stryker-1872--p3]\n      grade: lead\nstatus: lead\n---\nText.\n",
      "data/roster.csv": "rosterId,nameAsWritten,sourceId,page\nr1,John Smith,stryker-1872,3\n",
    });
    expect(checkSources(root).map((p) => p.file).sort()).toEqual(["data/roster.csv", "src/content/patriots/a.mdx"]);
  });

  it("ties a citation to exactly one entry: the id itself, or the id then -- and a local part", () => {
    const nara = entry({ id: "nara", status: "approved", reviewer: "R", decidedOn: "2027-01-05" });
    const root = repo([approved, nara], {
      "src/content/places/a.json": place(["nara-m804--s1234", "stryker-1872-reprint-1967", "stryker-1872--p1", "nara"]),
    });
    expect(checkSources(root).map((p) => p.sourceId)).toEqual(["nara-m804--s1234", "stryker-1872-reprint-1967"]);
  });

  it("checks the ids of source records themselves", () => {
    const root = repo([entry()], { "src/content/sources/s.json": JSON.stringify({ id: "stryker-1872--p3" }) });
    expect(checkSources(root)).toEqual([
      { file: "src/content/sources/s.json", sourceId: "stryker-1872--p3", reason: "source stryker-1872 is pending" },
    ]);
  });

  it("fails closed on MDX it cannot read, including a byte-order mark before the frontmatter", () => {
    const fm = ["---", "id: smith-john-1745", "name:", "  variants:", "    - text: J", "      sourceIds: [stryker-1872--p3]", "      grade: lead", "---", ""].join("\n");
    const root = repo([entry()], { "src/content/patriots/bom.mdx": "\uFEFF" + fm, "src/content/patriots/none.mdx": "No frontmatter.\n" });
    const found = checkSources(root).map((p) => `${p.file}: ${p.reason}`).sort();
    expect(found).toEqual([
      "src/content/patriots/bom.mdx: source stryker-1872 is pending",
      "src/content/patriots/none.mdx: no frontmatter could be read",
    ]);
  });

  it("reads the roster as real CSV: quoted fields, a quoted header, a byte-order mark", () => {
    const root = repo([entry()], {
      "data/roster.csv": '\uFEFF"sourceId","rosterId","nameAsWritten"\nstryker-1872--p3,r1,"Smith, John"\n',
    });
    expect(checkSources(root)).toEqual([
      { file: "data/roster.csv", sourceId: "stryker-1872--p3", reason: "source stryker-1872 is pending" },
    ]);
  });

  it("fails closed on a roster with no sourceId column, and on a content file of another type", () => {
    const root = repo([approved], { "data/roster.csv": "rosterId,name\nr1,John\n", "src/content/places/x.yaml": "id: x\n" });
    const found = checkSources(root).map((p) => `${p.file}: ${p.reason}`).sort();
    expect(found).toEqual(["data/roster.csv: no sourceId column", "src/content/places/x.yaml: not a content file type the check can read"]);
  });

  it("finds nothing wrong in this repository", () => {
    expect(checkSources(".")).toEqual([]);
  });
});
