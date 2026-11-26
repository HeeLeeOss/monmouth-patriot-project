/**
 * Content schemas for the Monmouth Patriot Project.
 *
 * Every factual field (a value read from a record: a name, a date, a rank, a unit, a place) is "sourced": it keeps
 * every variant the records give, each with its original text, a parsed value, the sources that support it and an
 * evidence grade. When the variants disagree, one is marked preferred and the choice carries a written rationale.
 * No single value is asserted as the winner without one.
 *
 * Ids (record ids, cross-references), statuses and record types are the project's own bookkeeping, not facts, and
 * are plain values. A connection code (A–E) is a graded claim with its sources, not a value read from a record.
 */
import { z } from "astro/zod";
import { isListing, isMarkerEvidence, isNameEvidence } from "./places";

/** The six evidence grades, strongest first. Their fixed wording lives in docs/standards. */
export const GRADES = ["proved", "probable", "possible", "lead", "unsupported", "disproved"] as const;
export const grade = z.enum(GRADES);

/** A source id, matching a file in src/content/sources and an entry on the approved-sources list. */
export const sourceId = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "source ids are lower-case words joined by hyphens");
const sourceIds = z.array(sourceId).min(1, "cite at least one source");

/** One reading of a fact, as one source gives it. Strict: a reading holds nothing but these four keys. */
export const variant = <T extends z.ZodType>(value: T) =>
  z.strictObject({
    /** The text exactly as the record has it. */
    text: z.string().trim().min(1),
    /** The parsed value, when the text can be parsed. */
    value: value.optional(),
    sourceIds,
    grade,
  });

type Reading = { text: string; value?: unknown };

/** Two readings agree when both are parsed and their values match, or when their texts match. */
const agree = (a: Reading, b: Reading): boolean =>
  a.value !== undefined && b.value !== undefined
    ? JSON.stringify(a.value) === JSON.stringify(b.value)
    : a.text.trim().toLowerCase() === b.text.trim().toLowerCase();

const disagree = (readings: Reading[]): boolean =>
  readings.some((a, i) => readings.slice(i + 1).some((b) => !agree(a, b)));

/** A factual field: every sourced variant, and the preferred one with a rationale when they disagree. */
export const sourced = <T extends z.ZodType>(value: T) =>
  z
    .strictObject({
      variants: z.array(variant(value)).min(1),
      preferred: z.number().int().min(0).optional(),
      rationale: z.string().trim().min(1).optional(),
    })
    .superRefine((field, ctx) => {
      const { variants, preferred } = field;
      if (preferred !== undefined && preferred >= variants.length) {
        ctx.addIssue({ code: "custom", path: ["preferred"], message: "preferred must point at one of the variants" });
      } else if (preferred !== undefined && variants[preferred]?.grade === "disproved") {
        ctx.addIssue({ code: "custom", path: ["preferred"], message: "the preferred variant cannot be disproved" });
      }
      if (!disagree(variants as Reading[])) return;
      if (preferred === undefined) {
        ctx.addIssue({ code: "custom", path: ["preferred"], message: "variants disagree: name the preferred variant" });
      }
      if (field.rationale === undefined) {
        ctx.addIssue({ code: "custom", path: ["rationale"], message: "variants disagree: give a sourced rationale" });
      }
    });

/** A date parsed as YYYY, YYYY-MM or YYYY-MM-DD, with real months and days. */
export const partialDate = z
  .string()
  .regex(/^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/, "dates parse as YYYY, YYYY-MM or YYYY-MM-DD");

/**
 * Fold a name into an id part: strip accents and apostrophes, lower-case it, and join words with hyphens.
 * "O'Brien" → "obrien", "Müller" → "muller", "Van Cortlandt" → "van-cortlandt".
 */
export const idPart = (name: string): string =>
  name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/['’]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * A permanent person id: idPart(surname)-idPart(given name)-year, where the year is the birth or baptism year
 * (else the first record's year) between 1500 and 1999, or `xxxx` when unknown. A second person who would get the
 * same id adds `-2`, a third `-3`, and so on. The id is opaque once minted: it is never parsed back into a name, and
 * it never changes; a split or merge leaves a redirect.
 */
export const personId = z
  .string()
  .regex(
    /^[a-z]+(?:-[a-z]+)+-(?:1[5-9]\d\d|xxxx)(?:-[2-9]|-[1-9]\d+)?$/,
    "person ids are surname-given-year (or -xxxx), with -2, -3… for a second or third person, e.g. huddy-joshua-1735",
  );

export const placeId = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "place ids are lower-case words joined by hyphens");
export const unitId = placeId;

export const CONNECTIONS = ["A", "B", "C", "D", "E"] as const;
export const STATUSES = ["lead", "draft", "reviewed", "published"] as const;

const text = sourced(z.string().trim().min(1));
const date = sourced(partialDate);

export const patriotSchema = z.object({
  id: personId,
  name: text,
  /** Every spelling found, each with its source. */
  nameVariants: z.array(variant(z.string())).default([]),
  born: date.optional(),
  died: date.optional(),
  connections: z.array(z.object({ code: z.enum(CONNECTIONS), grade, sourceIds })).default([]),
  service: z
    .array(
      z.object({
        unit: sourced(unitId),
        rank: text.optional(),
        from: date.optional(),
        to: date.optional(),
      }),
    )
    .default([]),
  residence: z.array(sourced(placeId)).default([]),
  burial: sourced(placeId).optional(),
  namesakes: z.array(placeId).default([]),
  related: z.array(z.object({ id: z.string().min(1), relation: text })).default([]),
  status: z.enum(STATUSES),
  doNotConfuseWith: z.array(z.string().min(1)).default([]),
  searchedNotFound: z.array(z.object({ what: z.string(), where: z.string(), when: z.string() })).default([]),
  externalIds: z.record(z.string(), z.string()).default({}),
});

export const personSchema = z.object({
  id: personId,
  name: text,
  role: text,
  born: date.optional(),
  died: date.optional(),
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

const coordinates = z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) });

/** Grades a marker or a name alone can support: a marker is a lead, never proof (evidence rule 6). */
const LEAD_OR_WEAKER = new Set(["lead", "unsupported", "disproved"]);

/** The longest text a place field may hold: room for a name or a date, not for an inscription. */
const PLACE_TEXT_MAX = 200;

type Field = { variants: { text: string; sourceIds: string[]; grade: string }[] } | null | undefined;

/**
 * A place with dated names: historic places and modern namesakes alike. `validTo: null` means it still exists.
 *
 * A place with an honoree is a **namesake**, and every marker or monument is one. A namesake must cite its GNIS
 * feature or HMDB marker page in `sourceIds`, and carry coordinates, a summary in our own words and an accuracy
 * verdict, which stays `unverified` until a named person audits it. A namesake may have `validFrom: null` when no
 * source dates it yet (the key is still required, so the gap is stated); any other place must be dated (AC-03).
 *
 * Evidence limits (evidence rule 6, and the allow-list's terms for each source):
 * - whatever is read only from HMDB is a lead, except a contributor's coordinates;
 * - an honoree read only from HMDB or GNIS is a lead, and so is a GNIS name offered as a historic name;
 * - who erected a marker is never quoted from HMDB: marker text comes only from our own reading of the marker.
 *
 * The object and its sourced fields are strict and place texts are short, so there is nowhere for copied marker text
 * or a rehosted photograph.
 */
export const placeSchema = z
  .strictObject({
    id: placeId,
    type: z.enum(PLACE_TYPES),
    historicName: text,
    modernName: text,
    validFrom: date.nullable(),
    validTo: date.nullable(),
    parents: z.array(z.object({ placeId: sourced(placeId), from: date, to: date.nullable() })).default([]),
    coordinates: sourced(coordinates).optional(),
    /** The person or event the place is named for, as the place or marker names them. */
    honoree: text.optional(),
    /** Who named, erected or dedicated it, and when, if known. */
    namedBy: text.optional(),
    namedOn: date.optional(),
    /** The listings this place was read from: GNIS features (`usgs-gnis--f…`) or HMDB markers (`hmdb--m…`). */
    sourceIds: z.array(sourceId).min(1).optional(),
    /** What the place or marker is, in the project's own words; marker text is summarised, never copied. */
    summary: z.string().trim().min(1).max(500).optional(),
    /** The project's audit verdict on the marker or name; its evidence lives in the audit table. */
    accuracy: z.enum(ACCURACY).optional(),
    auditedBy: z.string().trim().min(1).optional(),
    auditedOn: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "an audit is dated YYYY-MM-DD")
      .optional(),
  })
  .superRefine((p, ctx) => {
    const fields: Record<string, Field> = {
      historicName: p.historicName,
      modernName: p.modernName,
      validFrom: p.validFrom,
      validTo: p.validTo,
      coordinates: p.coordinates,
      honoree: p.honoree,
      namedBy: p.namedBy,
      namedOn: p.namedOn,
    };
    const cap = (key: string, only: (id: string) => boolean, message: string) =>
      fields[key]?.variants.forEach((variant, i) => {
        if (variant.sourceIds.every(only) && !LEAD_OR_WEAKER.has(variant.grade))
          ctx.addIssue({ code: "custom", path: [key, "variants", i, "grade"], message });
      });
    for (const [key, field] of Object.entries(fields)) {
      field?.variants.forEach((variant, i) => {
        if (variant.text.length > PLACE_TEXT_MAX)
          ctx.addIssue({ code: "custom", path: [key, "variants", i, "text"], message: `a place field holds at most ${PLACE_TEXT_MAX} characters` });
      });
      if (key !== "coordinates" && key !== "honoree")
        cap(key, isMarkerEvidence, "what is read only from HMDB is a lead until another record supports it");
    }
    cap(
      "honoree",
      (id) => isMarkerEvidence(id) || isNameEvidence(id),
      "an honoree read only from a marker or a name is a lead until another record supports it",
    );
    cap("historicName", isNameEvidence, "GNIS gives the current official name; as a historic name it is a lead");
    p.namedBy?.variants.forEach((variant, i) => {
      if (variant.sourceIds.some(isMarkerEvidence))
        ctx.addIssue({
          code: "custom",
          path: ["namedBy", "variants", i, "sourceIds"],
          message: "who erected a marker is quoted from our own reading of the marker, never from HMDB",
        });
    });

    const audited = p.auditedBy !== undefined || p.auditedOn !== undefined;
    if (p.accuracy !== undefined && p.accuracy !== "unverified" && (p.auditedBy === undefined || p.auditedOn === undefined)) {
      ctx.addIssue({ code: "custom", path: ["accuracy"], message: "an accuracy verdict needs auditedBy and auditedOn" });
    }
    if ((p.accuracy === undefined || p.accuracy === "unverified") && audited) {
      ctx.addIssue({ code: "custom", path: ["auditedBy"], message: "an audit records its verdict in accuracy" });
    }
    const namesake = p.honoree !== undefined || p.type === "marker" || p.type === "monument";
    if (!namesake) {
      if (p.validFrom === null)
        ctx.addIssue({ code: "custom", path: ["validFrom"], message: "a place without an honoree must be dated" });
      return;
    }
    for (const key of ["honoree", "coordinates", "accuracy", "sourceIds", "summary"] as const) {
      if (p[key] === undefined) ctx.addIssue({ code: "custom", path: [key], message: `a namesake needs ${key}` });
    }
    if (p.sourceIds !== undefined && !p.sourceIds.some(isListing)) {
      ctx.addIssue({
        code: "custom",
        path: ["sourceIds"],
        message: "a namesake cites its GNIS feature (usgs-gnis--f<id>) or HMDB marker page (hmdb--m<number>)",
      });
    }
  });

export const UNIT_KINDS = ["continental", "state-troops", "militia", "levies"] as const;

export const unitSchema = z.object({
  id: unitId,
  name: text,
  nameVariants: z.array(variant(z.string())).default([]),
  kind: sourced(z.enum(UNIT_KINDS)),
  state: text,
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
  credit: z.string().min(1).optional(),
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
  date,
  place: sourced(placeId),
});
