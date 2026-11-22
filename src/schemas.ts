/**
 * Content schemas for the Monmouth Patriot Project.
 *
 * Every factual field is "sourced": it keeps every variant the records give, each with its original text, a parsed
 * value, the sources that support it and an evidence grade. When the variants disagree, one is marked preferred and
 * the choice carries a written rationale. No single value is asserted as the winner without one.
 */
import { z } from "astro/zod";

/** The six evidence grades, strongest first. Their fixed wording lives in docs/standards. */
export const GRADES = ["proved", "probable", "possible", "lead", "unsupported", "disproved"] as const;
export const grade = z.enum(GRADES);

/** A source id, matching a file in src/content/sources and an entry on the approved-sources list. */
export const sourceId = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "source ids are lower-case words joined by hyphens");

/** One reading of a fact, as one source gives it. */
export const variant = <T extends z.ZodType>(value: T) =>
  z.object({
    /** The text exactly as the record has it. */
    text: z.string().min(1),
    /** The parsed value, when the text can be parsed. */
    value: value.optional(),
    sourceIds: z.array(sourceId).min(1, "every variant cites at least one source"),
    grade,
  });

/** Whether two variants disagree: their parsed values differ, or, when unparsed, their texts do. */
const key = (v: { text: string; value?: unknown }) => JSON.stringify(v.value === undefined ? v.text : v.value);

/** A factual field: every sourced variant, and the preferred one with a rationale when they disagree. */
export const sourced = <T extends z.ZodType>(value: T) =>
  z
    .object({
      variants: z.array(variant(value)).min(1),
      preferred: z.number().int().min(0).optional(),
      rationale: z.string().min(1).optional(),
    })
    .superRefine((field, ctx) => {
      if (field.preferred !== undefined && field.preferred >= field.variants.length) {
        ctx.addIssue({ code: "custom", path: ["preferred"], message: "preferred must point at one of the variants" });
      }
      const disagree = new Set(field.variants.map(key)).size > 1;
      if (!disagree) return;
      if (field.preferred === undefined) {
        ctx.addIssue({ code: "custom", path: ["preferred"], message: "variants disagree: name the preferred variant" });
      }
      if (field.rationale === undefined) {
        ctx.addIssue({ code: "custom", path: ["rationale"], message: "variants disagree: give a sourced rationale" });
      }
    });

/** A date as written, with an optional ISO-style parse (YYYY, YYYY-MM or YYYY-MM-DD). */
export const partialDate = z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, "dates parse as YYYY, YYYY-MM or YYYY-MM-DD");

/**
 * A permanent person id: surname, given name, then a four-digit year (birth or baptism, else first record),
 * lower case, words joined by hyphens. It never changes; a split or merge leaves a redirect.
 */
export const personId = z
  .string()
  .regex(/^[a-z]+(?:-[a-z]+)+-\d{4}$/, "person ids are surname-given-year, e.g. huddy-joshua-1735");

export const placeId = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "place ids are lower-case words joined by hyphens");

export const CONNECTIONS = ["A", "B", "C", "D", "E"] as const;
export const STATUSES = ["lead", "draft", "reviewed", "published"] as const;

export const patriotSchema = z.object({
  id: personId,
  name: z.string().min(1),
  nameVariants: z.array(z.string().min(1)).default([]),
  born: sourced(partialDate).optional(),
  died: sourced(partialDate).optional(),
  connections: z.array(z.object({ code: z.enum(CONNECTIONS), grade, sourceIds: z.array(sourceId).min(1) })).default([]),
  service: z
    .array(
      z.object({
        unitId: z.string().min(1),
        rank: sourced(z.string()).optional(),
        from: partialDate.optional(),
        to: partialDate.optional(),
        sourceIds: z.array(sourceId).min(1),
        grade,
      }),
    )
    .default([]),
  residence: z.array(sourced(placeId)).default([]),
  burial: sourced(placeId).optional(),
  namesakes: z.array(placeId).default([]),
  related: z.array(z.object({ id: z.string().min(1), relation: z.string().min(1) })).default([]),
  status: z.enum(STATUSES),
  doNotConfuseWith: z.array(z.string().min(1)).default([]),
  searchedNotFound: z.array(z.object({ what: z.string(), where: z.string(), when: z.string() })).default([]),
  externalIds: z.record(z.string(), z.string()).default({}),
});

export const personSchema = z.object({
  id: personId,
  name: z.string().min(1),
  role: z.string().min(1),
  born: sourced(partialDate).optional(),
  died: sourced(partialDate).optional(),
  sourceIds: z.array(sourceId).min(1),
});

export const PLACE_TYPES = [
  "county",
  "township",
  "settlement",
  "farm",
  "church",
  "cemetery",
  "bridge",
  "park",
  "road",
  "school",
  "marker",
  "monument",
  "building",
  "other",
] as const;

export const ACCURACY = ["accurate", "minor error", "significant error", "unverifiable", "unverified"] as const;

/** A place with dated names: historic places and modern namesakes alike. `validTo: null` means it still exists. */
export const placeSchema = z.object({
  id: placeId,
  type: z.enum(PLACE_TYPES),
  historicName: z.string().min(1),
  modernName: z.string().min(1),
  validFrom: partialDate,
  validTo: partialDate.nullable(),
  parents: z.array(z.object({ placeId, from: partialDate, to: partialDate.nullable() })).default([]),
  coordinates: z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) }).optional(),
  honoree: z.string().optional(),
  accuracy: z.enum(ACCURACY).optional(),
  sourceIds: z.array(sourceId).default([]),
});

export const unitSchema = z.object({
  id: placeId,
  name: z.string().min(1),
  nameVariants: z.array(z.string()).default([]),
  kind: z.enum(["continental", "state-troops", "militia", "levies"]),
  state: z.string().min(2),
  sourceIds: z.array(sourceId).default([]),
});

export const sourceSchema = z.object({
  id: sourceId,
  title: z.string().min(1),
  /** The layered citation: item, record, copy, where read, when. */
  citation: z.object({
    item: z.string().min(1),
    record: z.string().optional(),
    copy: z.string().min(1),
    whereRead: z.string().min(1),
    when: z.string().min(1),
  }),
  url: z.url().optional(),
  rights: z.string().min(1),
  transcribedBy: z.string().optional(),
  verifiedBy: z.string().optional(),
});

export const storySchema = z.object({
  title: z.string().min(1),
  patriotId: personId,
  status: z.enum(STATUSES),
});

export const engagementSchema = z.object({
  title: z.string().min(1),
  date: partialDate,
  placeId,
  sourceIds: z.array(sourceId).default([]),
});
