/**
 * The source check: every source id cited anywhere in the content or the roster, and the id of every source record,
 * must belong to an approved entry on sources/allowlist.yml. It fails closed: a file it cannot read is a problem, not
 * a pass. Run by the test suite in CI (tests/sources.test.ts), and by hand with `node scripts/check-sources.ts` on
 * Node 24.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { parse } from "yaml";
import { entryFor, parseAllowlist } from "../src/allowlist.ts";

export type Problem = { file: string; sourceId: string; reason: string };

const stripBom = (text: string) => text.replace(/^\uFEFF/, "");

/** Every value under a `sourceIds` or `sourceId` key, at any depth, whether a string or a list. */
const citedIn = (data: unknown, out: string[] = []): string[] => {
  if (Array.isArray(data)) data.forEach((d) => citedIn(d, out));
  else if (data && typeof data === "object")
    for (const [k, v] of Object.entries(data)) {
      if (k === "sourceIds" || k === "sourceId") {
        for (const s of Array.isArray(v) ? v : [v]) out.push(String(s));
      } else citedIn(v, out);
    }
  return out;
};

/** The frontmatter of an MDX or Markdown file, or undefined when there is none to read. */
const frontmatter = (text: string): unknown => {
  const m = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/.exec(stripBom(text));
  return m ? parse(m[1]!) : undefined;
};

/** A small RFC 4180 reader: quoted fields, doubled quotes, commas and newlines inside quotes. */
export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const s = stripBom(text);
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') (field += '"'), i++;
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") row.push(field), (field = "");
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(field), rows.push(row), (row = []), (field = "");
    } else field += c;
  }
  if (field !== "" || row.length > 0) row.push(field), rows.push(row);
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
};

const walk = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
        d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)],
      )
    : [];

/** The ids a file cites, or a reason it cannot be read. */
const idsIn = (path: string, isSourceRecord: boolean): string[] | string => {
  const text = readFileSync(path, "utf8");
  if (path.endsWith(".csv")) {
    const [head, ...rows] = parseCsv(text);
    const col = (head ?? []).map((h) => h.trim()).indexOf("sourceId");
    if (col < 0) return "no sourceId column";
    return rows.map((r) => (r[col] ?? "").trim()).filter(Boolean);
  }
  let data: unknown;
  if (path.endsWith(".json")) {
    try {
      data = JSON.parse(stripBom(text));
    } catch {
      return "not valid JSON";
    }
  } else if (path.endsWith(".mdx") || path.endsWith(".md")) {
    try {
      data = frontmatter(text);
    } catch {
      return "frontmatter is not valid YAML";
    }
    if (data === undefined) return "no frontmatter could be read";
  } else return "not a content file type the check can read";
  const ids = citedIn(data);
  // A source record's own id is a citation too: it names the copy the record was read from.
  if (isSourceRecord && data && typeof data === "object" && "id" in data) ids.push(String((data as { id: unknown }).id));
  return ids;
};

export function checkSources(root: string): Problem[] {
  const entries = parseAllowlist(readFileSync(join(root, "sources", "allowlist.yml"), "utf8"));
  const sourcesDir = join(root, "src", "content", "sources") + sep;
  const files = [
    ...walk(join(root, "src", "content")).filter((p) => !p.endsWith(".gitkeep")),
    join(root, "data", "roster.csv"),
  ].filter(existsSync);
  const problems: Problem[] = [];
  for (const path of files) {
    const file = relative(root, path).split(sep).join("/");
    const ids = idsIn(path, path.startsWith(sourcesDir));
    if (typeof ids === "string") {
      problems.push({ file, sourceId: "", reason: ids });
      continue;
    }
    for (const sourceId of ids) {
      const entry = entryFor(entries, sourceId);
      if (!entry) problems.push({ file, sourceId, reason: `source ${sourceId} is not on the allow-list` });
      else if (entry.status !== "approved") problems.push({ file, sourceId, reason: `source ${entry.id} is ${entry.status}` });
    }
  }
  return problems;
}

if (/check-sources\.ts$/.test(process.argv[1] ?? "")) {
  const problems = checkSources(".");
  for (const p of problems) console.error(`${p.file}: ${p.reason}`);
  process.exit(problems.length === 0 ? 0 : 1);
}
