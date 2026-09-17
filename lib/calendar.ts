import { HDate, Sedra, HebrewCalendar, flags } from "@hebcal/core";
import { DafYomi, MishnaYomiIndex } from "@hebcal/learning";

export type DailyLearning = {
  gregorian: string;
  hebrewDate: string;
  hebrewDateHe: string;
  hebrewYear: number;
  /** Parsha of the coming Shabbat, e.g. "Ha'azinu". Null on a Yom Tov week. */
  parsha: string | null;
  /** Parsha slug for tag matching, e.g. "haazinu". */
  parshaSlug: string | null;
  /** True when the coming Shabbat's reading is a festival reading. */
  parshaIsChag: boolean;
  dafYomi: { work: string; ref: string; display: string; displayHe: string };
  mishnaYomi: { work: string; ref: string; display: string } | null;
  /** Active holidays today or in the next 10 days, as tag slugs. */
  upcomingHolidays: { slug: string; label: string; daysAway: number }[];
};

const mishnaIndex = new MishnaYomiIndex();

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Holidays we care about for feed matching, mapped from hebcal's English
 * description to the tag slug used on posts.
 */
const HOLIDAY_TAGS: Record<string, string> = {
  "Rosh Hashana": "rosh-hashanah",
  "Rosh Hashana II": "rosh-hashanah",
  "Yom Kippur": "yom-kippur",
  Sukkot: "sukkot",
  "Shmini Atzeret": "sukkot",
  "Simchat Torah": "simchat-torah",
  Chanukah: "chanukah",
  "Tu BiShvat": "tu-bishvat",
  Purim: "purim",
  Pesach: "pesach",
  "Yom HaShoah": "yom-hashoah",
  "Lag BaOmer": "lag-baomer",
  Shavuot: "shavuot",
  "Tish'a B'Av": "tisha-bav",
};

function matchHolidayTag(desc: string): string | null {
  for (const [key, slug] of Object.entries(HOLIDAY_TAGS)) {
    if (desc.startsWith(key)) return slug;
  }
  return null;
}

/** Everything the feed needs to know about what today is. */
export function getDailyLearning(date: Date = new Date()): DailyLearning {
  const hd = new HDate(date);
  const sedra = new Sedra(hd.getFullYear(), false);
  const lookup = sedra.lookup(hd);
  const parshaName = lookup.parsha.join("-");

  const daf = new DafYomi(date);
  const mishna = mishnaIndex.lookup(date);

  const holidays: { slug: string; label: string; daysAway: number }[] = [];
  const seen = new Set<string>();
  for (let i = 0; i <= 10; i++) {
    const probe = new Date(date);
    probe.setDate(probe.getDate() + i);
    const events = HebrewCalendar.getHolidaysOnDate(new HDate(probe), false) ?? [];
    for (const ev of events) {
      if (ev.getFlags() & flags.MINOR_FAST) continue;
      const slug = matchHolidayTag(ev.getDesc());
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      holidays.push({ slug, label: ev.render("en"), daysAway: i });
    }
  }

  return {
    gregorian: date.toISOString().slice(0, 10),
    hebrewDate: hd.render("en"),
    hebrewDateHe: hd.renderGematriya(),
    hebrewYear: hd.getFullYear(),
    parsha: lookup.chag ? null : parshaName,
    parshaSlug: lookup.chag ? null : slugify(parshaName),
    parshaIsChag: Boolean(lookup.chag),
    dafYomi: {
      work: daf.name,
      ref: String(daf.blatt),
      display: daf.render("en"),
      displayHe: daf.render("he"),
    },
    mishnaYomi: mishna
      ? {
          work: mishna[0].k,
          ref: mishna[0].v,
          display:
            mishna[0].k === mishna[mishna.length - 1].k
              ? `${mishna[0].k} ${mishna[0].v}–${mishna[mishna.length - 1].v}`
              : `${mishna[0].k} ${mishna[0].v} – ${mishna[mishna.length - 1].k} ${mishna[mishna.length - 1].v}`,
        }
      : null,
    upcomingHolidays: holidays,
  };
}
