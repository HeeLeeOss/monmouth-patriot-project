import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GRADES } from "../src/schemas";

type Wording = { label: string; meaning: string; use: string[]; avoid: string[]; example: string };
const table = JSON.parse(readFileSync("docs/standards/grades.json", "utf8")) as Record<string, Wording>;
const doc = (name: string) => readFileSync(`docs/standards/${name}`, "utf8");
const below = GRADES.filter((g) => g !== "proved");

/** Whether `phrase` occurs in `text` as whole words, ignoring case. */
const says = (text: string, phrase: string) =>
  new RegExp(`(^|[^a-z])${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i").test(text);

/** The cells of the row for `label` in the grade table of evidence-rules.md. */
const row = (label: string): string[] => {
  const line = doc("evidence-rules.md")
    .split("\n")
    .find((l) => l.startsWith(`| **${label}**`));
  if (!line) throw new Error(`no row for ${label}`);
  return line.split("|").map((c) => c.trim());
};
/** The quoted phrases in a table cell. */
const quoted = (cell: string) => [...cell.matchAll(/"([^"]+)"/g)].map((m) => m[1]);

describe("grade wording table (AC-09)", () => {
  it("lists the six grades, strongest first, matching the content schema", () => {
    expect(Object.keys(table)).toEqual([...GRADES]);
    expect(Object.values(table).map((g) => g.label)).toEqual([
      "Proved",
      "Probable",
      "Possible",
      "Lead",
      "Unsupported",
      "Disproved",
    ]);
  });

  it.each(GRADES)("%s has a meaning, wording to use and avoid, and an example that follows it", (g) => {
    const w = table[g]!;
    expect(w.meaning.trim().length).toBeGreaterThan(20);
    expect(w.use.length).toBeGreaterThan(0);
    expect(w.avoid.length).toBeGreaterThan(0);
    expect(w.use.some((p) => says(w.example, p))).toBe(true);
    expect(w.avoid.filter((p) => says(w.example, p))).toEqual([]);
  });

  it("gives the bare assertion 'was' to Proved alone", () => {
    expect(table.proved!.use).toContain("was");
    for (const g of below) expect(table[g]!.use.filter((p) => says(p, "was"))).toEqual([]);
  });

  it("gives 'probably' to Probable alone", () => {
    expect(GRADES.filter((g) => table[g]!.use.some((p) => says(p, "probably")))).toEqual(["probable"]);
  });

  it("never lets one grade's wording contain another grade's wording", () => {
    for (const a of GRADES)
      for (const b of GRADES) {
        if (a === b) continue;
        for (const p of table[a]!.use) for (const q of table[b]!.use) expect(says(p, q), `${a} "${p}" vs ${b} "${q}"`).toBe(false);
      }
  });

  it("makes every grade below Proved avoid the other grades' qualifiers", () => {
    for (const g of below)
      for (const other of below.filter((o) => o !== g)) for (const q of table[other]!.use) expect(table[g]!.avoid).toContain(q);
  });

  it("never lets a grade use a phrase it also avoids", () => {
    for (const g of GRADES) expect(table[g]!.use.filter((p) => table[g]!.avoid.some((a) => says(p, a)))).toEqual([]);
  });

  it("is restated exactly in evidence-rules.md: each row's use and avoid phrases match the table", () => {
    for (const g of GRADES) {
      const cells = row(table[g]!.label);
      expect(quoted(cells[3]!), `${g} use`).toEqual(table[g]!.use);
      expect(quoted(cells[4]!), `${g} avoid`).toEqual(table[g]!.avoid);
    }
    expect(doc("evidence-rules.md")).toContain("grades.json");
  });
});

describe("written rules (AC-10)", () => {
  it("transcription conventions cover editorial brackets, uncertain readings, spelling and a person's check", () => {
    const t = doc("transcription.md");
    expect(t).toContain("[ ]");
    expect(t).toContain("[?]");
    expect(t).toMatch(/spelling as written/i);
    expect(t).toMatch(/checked by a person against the (page )?image/i);
  });

  it("prose voice has the answer-first lead summary rule", () => {
    expect(doc("prose-voice.md")).toMatch(/lead summary/i);
  });

  it("privacy has the consent rule and the 1950 lineage cut-off, and keeps consent records out of the public repo", () => {
    const p = doc("privacy.md");
    expect(p).toMatch(/written consent/i);
    expect(p).toContain("1950");
    expect(p).toMatch(/never (stored|kept) in (this|the public) repo/i);
  });

  it("the citation guide covers the layered citation and the evidence tags", () => {
    const c = doc("citation-guide.md");
    for (const layer of ["item", "record", "copy", "where read", "when"]) expect(c.toLowerCase()).toContain(layer);
    for (const tag of ["[V]", "[R]", "[I]", "[OPEN]"]) expect(c).toContain(tag);
  });

  it("the standards are written without assuming every patriot was a man", () => {
    for (const name of ["evidence-rules.md", "prose-voice.md"]) {
      expect(doc(name), name).not.toMatch(/\b(he|his|him|the man's|the man)\b/i);
    }
    for (const g of GRADES) expect(table[g]!.meaning, g).not.toMatch(/\b(he|his|him|the man's|the man)\b/i);
  });
});
