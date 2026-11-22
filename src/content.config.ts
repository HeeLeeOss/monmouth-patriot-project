import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import {
  engagementSchema,
  patriotSchema,
  personSchema,
  placeSchema,
  sourceSchema,
  storySchema,
  unitSchema,
} from "./schemas";

type Pattern = "**/*.mdx" | "**/*.json";

/**
 * Records that carry their own permanent `id` use it as the entry id, so a file's name never decides a record's id
 * or URL, and two files with the same id fail the build. Stories and engagements are named by their files.
 */
const byId = (dir: string, pattern: Pattern) => {
  const fileOf = new Map<string, string>();
  return glob({
    pattern,
    base: `./src/content/${dir}`,
    generateId: ({ entry, data }) => {
      const id = data.id;
      if (typeof id !== "string" || id === "") throw new Error(`${dir}/${entry}: a record needs an id`);
      const other = fileOf.get(id);
      if (other !== undefined && other !== entry) {
        throw new Error(`${dir}: id "${id}" is used by both ${other} and ${entry}; ids are permanent and unique`);
      }
      fileOf.set(id, entry);
      return id;
    },
  });
};
const byFile = (dir: string, pattern: Pattern) => glob({ pattern, base: `./src/content/${dir}` });

export const collections = {
  patriots: defineCollection({ loader: byId("patriots", "**/*.mdx"), schema: patriotSchema }),
  people: defineCollection({ loader: byId("people", "**/*.json"), schema: personSchema }),
  units: defineCollection({ loader: byId("units", "**/*.json"), schema: unitSchema }),
  stories: defineCollection({ loader: byFile("stories", "**/*.mdx"), schema: storySchema }),
  places: defineCollection({ loader: byId("places", "**/*.json"), schema: placeSchema }),
  engagements: defineCollection({ loader: byFile("engagements", "**/*.mdx"), schema: engagementSchema }),
  sources: defineCollection({ loader: byId("sources", "**/*.json"), schema: sourceSchema }),
};
