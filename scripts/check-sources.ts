/**
 * The source check: every source id cited anywhere in the content or the roster must belong to an approved entry on
 * sources/allowlist.yml. Run by the test suite in CI (tests/sources.test.ts), and by hand with
 * `node scripts/check-sources.ts` on Node 24.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parse } from "yaml";
import { entryFor, parseAllowlist } from "../src/allowlist.ts";

export type Problem = { file: string; sourceId: string; reason: string };

/** Every value under a `sourceIds` (list) or `sourceId` (single) key, at any depth. */
const citedIn = (data: unknown, out: string[] = []): string[] => {
  if (Array.isArray(data)) data.forEach((d) => citedIn(d, out));
  else if (data && typeof data === "object")
    for (const [k, v] of Object.entries(data)) {
      if (k === "sourceIds" && Array.isArray(v)) out.push(...v.filter((s): s is string => typeof s === "string"));
      else if (k === "sourceId" && typeof v === "string") out.push(v);
      else citedIn(v, out);
    }
  return out;
};

const frontmatter = (text: string): unknown => {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  return m ? parse(m[1]!) : {};
};

/** The sourceId column of a roster CSV (no quoted commas in ids). */
const rosterIds = (text: string): string[] => {
  const [head, ...rows] = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  const col = (head ?? "").split(",").indexOf("sourceId");
  return col < 0 ? [] : rows.map((r) => r.split(",")[col]?.trim() ?? "").filter(Boolean);
};

const walk = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
        d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)],
      )
    : [];

export function checkSources(root: string): Problem[] {
  const entries = parseAllowlist(readFileSync(join(root, "sources", "allowlist.yml"), "utf8"));
  const files = [...walk(join(root, "src", "content")), join(root, "data", "roster.csv")].filter(existsSync);
  const problems: Problem[] = [];
  for (const path of files) {
    const text = readFileSync(path, "utf8");
    const ids = path.endsWith(".json")
      ? citedIn(JSON.parse(text))
      : path.endsWith(".mdx") || path.endsWith(".md")
        ? citedIn(frontmatter(text))
        : path.endsWith(".csv")
          ? rosterIds(text)
          : [];
    const file = relative(root, path).split("\\").join("/");
    for (const sourceId of ids) {
      const entry = entryFor(entries, sourceId);
      if (!entry) problems.push({ file, sourceId, reason: `source ${sourceId} is not on the allow-list` });
      else if (entry.status !== "approved") problems.push({ file, sourceId, reason: `source ${entry.id} is ${entry.status}` });
    }
  }
  return problems;
}

if (/check-sources.ts$/.test(process.argv[1] ?? "")) {
  const problems = checkSources(".");
  for (const p of problems) console.error(`${p.file}: ${p.reason}`);
  process.exit(problems.length === 0 ? 0 : 1);
}
