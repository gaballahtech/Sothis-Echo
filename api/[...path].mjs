/**
 * The deployed site needs the same backend that `npm run api` starts locally.
 * This function mounts that router at /api/* on Vercel, so the study areas read
 * real Sentinel-1 / NISAR data from the site's own origin — no second host, no
 * CORS, no cross-service URL to configure.
 *
 * Fluid compute allows a 300 s invocation, which covers a cold build of both
 * study areas (~60 s, twelve COG windows plus NISAR browse).
 */
import { handleRequest } from '../server/api.mjs';

export const maxDuration = 300;

export default async function handler(req, res) {
  await handleRequest(req, res);
}
