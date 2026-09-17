/**
 * Pull recent items from every enabled source.
 *   npm run sync:sources
 * Run it from cron a few times a day.
 */
import { syncAllSources } from "../lib/source-sync.js";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const enabled = await db.source.count({ where: { enabled: true } });
const total = await db.source.count();
console.log(`${enabled} of ${total} sources enabled\n`);

const results = await syncAllSources();
for (const r of results) {
  const line = `  ${r.source.padEnd(16)} created ${r.created}, updated ${r.updated}`;
  console.log(r.error ? `${line}  [${r.error}]` : line);
}
if (!results.length) console.log("  nothing to do");

const off = await db.source.findMany({ where: { enabled: false }, select: { slug: true, setupNote: true } });
if (off.length) {
  console.log("\nnot enabled:");
  for (const s of off) console.log(`  ${s.slug.padEnd(16)} ${s.setupNote}`);
  console.log("\nConfigure these at /sources while signed in as a moderator.");
}
await db.$disconnect();
