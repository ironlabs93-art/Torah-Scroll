/** The tag vocabulary the POC ships with. Seeded into the Tag table. */
export const TRACKS = [
  { slug: "daf-yomi", label: "Daf Yomi", hebrew: "דף יומי" },
  { slug: "mishnah-yomi", label: "Mishnah Yomi", hebrew: "משנה יומית" },
  { slug: "parsha", label: "Parsha", hebrew: "פרשת השבוע" },
  { slug: "halacha", label: "Halacha", hebrew: "הלכה" },
  { slug: "nach-yomi", label: "Nach Yomi", hebrew: "נ״ך יומי" },
  { slug: "chumash", label: "Chumash", hebrew: "חומש" },
];

export const HOLIDAYS = [
  { slug: "rosh-hashanah", label: "Rosh Hashanah", hebrew: "ראש השנה" },
  { slug: "yom-kippur", label: "Yom Kippur", hebrew: "יום כיפור" },
  { slug: "sukkot", label: "Sukkot", hebrew: "סוכות" },
  { slug: "simchat-torah", label: "Simchat Torah", hebrew: "שמחת תורה" },
  { slug: "chanukah", label: "Chanukah", hebrew: "חנוכה" },
  { slug: "tu-bishvat", label: "Tu BiShvat", hebrew: "ט״ו בשבט" },
  { slug: "purim", label: "Purim", hebrew: "פורים" },
  { slug: "pesach", label: "Pesach", hebrew: "פסח" },
  { slug: "lag-baomer", label: "Lag BaOmer", hebrew: "ל״ג בעומר" },
  { slug: "shavuot", label: "Shavuot", hebrew: "שבועות" },
  { slug: "tisha-bav", label: "Tisha B'Av", hebrew: "תשעה באב" },
];

export const TOPICS = [
  { slug: "machshava", label: "Machshava", hebrew: "מחשבה" },
  { slug: "mussar", label: "Mussar", hebrew: "מוסר" },
  { slug: "tefillah", label: "Tefillah", hebrew: "תפילה" },
  { slug: "shabbos", label: "Shabbos", hebrew: "שבת" },
  { slug: "kashrus", label: "Kashrus", hebrew: "כשרות" },
  { slug: "chesed", label: "Chesed", hebrew: "חסד" },
  { slug: "jewish-history", label: "Jewish History", hebrew: "היסטוריה" },
  { slug: "hebrew-language", label: "Hebrew & Grammar", hebrew: "דקדוק" },
  { slug: "family", label: "Family & Chinuch", hebrew: "חינוך" },
  { slug: "beginner-friendly", label: "Beginner Friendly", hebrew: "למתחילים" },
];

export const ALL_TAGS = [
  ...TRACKS.map((t) => ({ ...t, kind: "TRACK" as const })),
  ...HOLIDAYS.map((t) => ({ ...t, kind: "HOLIDAY" as const })),
  ...TOPICS.map((t) => ({ ...t, kind: "TOPIC" as const })),
];

export const POST_TYPES = [
  { value: "TEXT", label: "Dvar Torah", blurb: "A thought, a chiddush, a question" },
  { value: "QUIZ", label: "Quiz", blurb: "Multiple choice with an explanation" },
  { value: "VIDEO", label: "Video", blurb: "Link a shiur and it plays in the feed" },
  { value: "IMAGE", label: "Diagram", blurb: "A chart or diagram, tagged to a source" },
] as const;
