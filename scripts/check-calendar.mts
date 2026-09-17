import { getDailyLearning } from "../lib/calendar.js";

const cases: [string, Date][] = [
  ["today", new Date()],
  ["Chanukah eve 2026-12-04", new Date(2026, 11, 4)],
  ["Pesach 2027-04-22", new Date(2027, 3, 22)],
  ["Purim 2027-03-23", new Date(2027, 2, 23)],
];
for (const [label, d] of cases) {
  const c = getDailyLearning(d);
  console.log(`\n== ${label} (${c.gregorian})`);
  console.log(`   ${c.hebrewDate}  /  ${c.hebrewDateHe}`);
  console.log(`   parsha: ${c.parsha ?? "(festival reading)"} [${c.parshaSlug}]`);
  console.log(`   daf:    ${c.dafYomi.display}  (${c.dafYomi.displayHe})`);
  console.log(`   mishna: ${c.mishnaYomi?.display ?? "-"}`);
  console.log(`   holidays: ${c.upcomingHolidays.map((h) => `${h.slug}+${h.daysAway}d`).join(", ") || "none"}`);
}
