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

const mdx = (dir: string) => glob({ pattern: "**/*.mdx", base: `./src/content/${dir}` });
const json = (dir: string) => glob({ pattern: "**/*.json", base: `./src/content/${dir}` });

export const collections = {
  patriots: defineCollection({ loader: mdx("patriots"), schema: patriotSchema }),
  people: defineCollection({ loader: json("people"), schema: personSchema }),
  units: defineCollection({ loader: json("units"), schema: unitSchema }),
  stories: defineCollection({ loader: mdx("stories"), schema: storySchema }),
  places: defineCollection({ loader: json("places"), schema: placeSchema }),
  engagements: defineCollection({ loader: mdx("engagements"), schema: engagementSchema }),
  sources: defineCollection({ loader: json("sources"), schema: sourceSchema }),
};
