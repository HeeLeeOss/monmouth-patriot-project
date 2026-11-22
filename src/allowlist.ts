/**
 * The approved-sources list (sources/allowlist.yml): every source the project may read, with the rights decision for
 * the specific copy or edition used. Nothing is read, and nothing may be cited, until its entry is approved by the
 * rights reviewer. See docs/sources-policy.md.
 */
import { z } from "astro/zod";
import { parse } from "yaml";

export const STATUSES = ["approved", "pending", "rejected"] as const;

/** Why a copy may (or may not) be used. */
export const RIGHTS_BASES = [
  "expired-copyright",
  "us-federal-work",
  "cc0",
  "permission",
  "terms-of-use",
  "proprietary",
] as const;

export const EXTRACTION_METHODS = ["human-transcription", "ocr-print", "structured-import", "facts-and-links-only", "none"] as const;

const isoDate = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "dates are YYYY-MM-DD");

export const entrySchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "ids are lower-case words joined by hyphens"),
    title: z.string().trim().min(1),
    custodian: z.string().trim().min(1),
    url: z.url(),
    format: z.string().trim().min(1),
    rights: z.object({
      basis: z.enum(RIGHTS_BASES),
      /** The specific copy or edition the decision covers: an original's status does not clear a vendor's scan. */
      copy: z.string().trim().min(1),
      analysis: z.string().trim().min(1),
    }),
    extraction: z.object({
      method: z.enum(EXTRACTION_METHODS),
      accuracyBaseline: z.string().trim().min(1),
    }),
    status: z.enum(STATUSES),
    reviewer: z.string().trim().min(1).optional(),
    decidedOn: isoDate.optional(),
  })
  .superRefine((e, ctx) => {
    if (e.status === "pending") {
      if (e.reviewer !== undefined || e.decidedOn !== undefined)
        ctx.addIssue({ code: "custom", path: ["status"], message: "a pending entry records no decision" });
      return;
    }
    if (e.reviewer === undefined)
      ctx.addIssue({ code: "custom", path: ["reviewer"], message: `an ${e.status} entry names who decided` });
    if (e.decidedOn === undefined)
      ctx.addIssue({ code: "custom", path: ["decidedOn"], message: `an ${e.status} entry records the date` });
  });

export type Entry = z.infer<typeof entrySchema>;

export const allowlistSchema = z
  .object({ sources: z.array(entrySchema) })
  .superRefine((list, ctx) => {
    const seen = new Set<string>();
    list.sources.forEach((e, i) => {
      if (seen.has(e.id)) ctx.addIssue({ code: "custom", path: ["sources", i, "id"], message: `duplicate id ${e.id}` });
      seen.add(e.id);
    });
  });

/** Parse and validate the allow-list text (YAML, of which JSON is a subset). Throws with every problem. */
export const parseAllowlist = (text: string): Entry[] => allowlistSchema.parse(parse(text)).sources;

/**
 * The entry a cited source id belongs to: the entry whose id equals it, or the longest entry id that it extends
 * with a hyphen (`stryker-1872-p123` belongs to `stryker-1872`).
 */
export const entryFor = (entries: Entry[], sourceId: string): Entry | undefined =>
  entries
    .filter((e) => sourceId === e.id || sourceId.startsWith(`${e.id}-`))
    .sort((a, b) => b.id.length - a.id.length)[0];
