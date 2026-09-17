/**
 * Pull today's daf, mishnayos and parsha into the feed.
 *   npm run sync:texts              today
 *   npm run sync:texts -- 2026-12-06   a specific date
 *
 * Run it from cron once a day, or just let the feed trigger it lazily.
 */
import { importDailyTexts } from "../lib/daily-import.js";
import { getDailyLearning } from "../lib/calendar.js";

const arg = process.argv[2];
const date = arg && /^\d{4}-\d{2}-\d{2}$/.test(arg) ? new Date(arg + "T12:00:00") : new Date();

const cal = getDailyLearning(date);
console.log(`${cal.gregorian}  ${cal.hebrewDate}`);
console.log(`  daf:     ${cal.dafYomi.display}`);
console.log(`  mishnah: ${cal.mishnaYomi?.display ?? "-"}`);
console.log(`  parsha:  ${cal.parsha ?? "(festival reading)"}`);
console.log("\nfetching from Sefaria...");

const r = await importDailyTexts({ date });
console.log(`\ncreated ${r.created}, updated ${r.updated}`);
if (r.failed.length) {
  console.log(`failed:  ${r.failed.join(", ")}`);
  console.log("\nIf every ref failed, check that www.sefaria.org is reachable from this machine.");
}
process.exit(r.created + r.updated > 0 ? 0 : 1);
