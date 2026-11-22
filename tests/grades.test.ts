import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GRADES } from "../src/schemas";

type Wording = { label: string; meaning: string; use: string[]; avoid: string[]; example: string };
const table = JSON.parse(readFileSync("docs/standards/grades.json", "utf8")) as Record<string, Wording>;
const doc = (name: string) => readFileSync(`docs/standards/${name}`, "utf8");

/** Whether `phrase` occurs in `text` as whole words, ignoring case. */
const says = (text: string, phrase: string) =>
  new RegExp(`(^|[^a-z])${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i").test(text);

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

  it.each(GRADES)("%s has a meaning, wording to use and avoid, and an example", (g) => {
    const w = table[g]!;
    expect(w.meaning.trim().length).toBeGreaterThan(20);
    expect(w.use.length).toBeGreaterThan(0);
    expect(w.avoid.length).toBeGreaterThan(0);
    expect(w.use.some((p) => says(w.example, p))).toBe(true);
    expect(w.avoid.filter((p) => says(w.example, p))).toEqual([]);
  });

  it("uses 'was' only for Proved", () => {
    const users = GRADES.filter((g) => table[g]!.use.includes("was"));
    expect(users).toEqual(["proved"]);
    for (const g of GRADES.filter((g) => g !== "proved")) expect(table[g]!.avoid).toContain("was");
  });

  it("uses 'probably' only for Probable", () => {
    const users = GRADES.filter((g) => table[g]!.use.includes("probably"));
    expect(users).toEqual(["probable"]);
    expect(table.proved!.avoid).toContain("probably");
  });

  it("never lets a grade use a phrase it also avoids", () => {
    for (const g of GRADES) expect(table[g]!.use.filter((p) => table[g]!.avoid.includes(p))).toEqual([]);
  });

  it("is restated in evidence-rules.md: every grade's label and wording appear there", () => {
    const rules = doc("evidence-rules.md");
    for (const g of GRADES) {
      expect(rules).toContain(table[g]!.label);
      for (const p of table[g]!.use) expect(says(rules, p)).toBe(true);
    }
    expect(rules).toContain("grades.json");
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

  it("privacy has the consent rule and the 1950 lineage cut-off", () => {
    const p = doc("privacy.md");
    expect(p).toMatch(/written consent/i);
    expect(p).toContain("1950");
  });

  it("the citation guide covers the layered citation and the evidence tags", () => {
    const c = doc("citation-guide.md");
    for (const layer of ["item", "record", "copy", "where read", "when"]) expect(c.toLowerCase()).toContain(layer);
    for (const tag of ["[V]", "[R]", "[I]", "[OPEN]"]) expect(c).toContain(tag);
  });
});
