import { readFile } from "node:fs/promises";
import type { APIRoute } from "astro";
import { PUBLIC_ASSETS, repositoryRoot } from "../../lib/documents";
import { resolve } from "node:path";
export function getStaticPaths() {
  return Object.entries(PUBLIC_ASSETS).map(([path, asset]) => ({
    params: { asset: asset.replace(/\.png$/, "") },
    props: { path },
  }));
}
export const GET: APIRoute = async ({ props }) =>
  new Response(
    new Uint8Array(await readFile(resolve(repositoryRoot, props.path))),
    { headers: { "Content-Type": "image/png" } },
  );
