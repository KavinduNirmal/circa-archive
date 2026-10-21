import { defineCollection } from "astro:content";
import { loadPublicDocuments } from "./lib/documents";

// Explicit registry: ignored/private files are not a publishing boundary.
const documents = defineCollection({ loader: () => loadPublicDocuments() });
export const collections = { documents };
