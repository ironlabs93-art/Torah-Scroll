/**
 * The channels the app ships knowing about.
 *
 * Two classes, and the difference matters:
 *
 *  - Built-in sources are assembled by this app from open library texts. They
 *    are on by default because nobody else's work is being redistributed.
 *
 *  - External sources are other people's publications. They ship DISABLED, each
 *    with a note saying what is still needed. Two things are usually missing: a
 *    channel id or feed URL that has to be looked up, and permission. Embedding
 *    a public YouTube video is ordinary use, but turning up to a publisher with
 *    their catalogue already syndicated is a poor way to introduce yourself,
 *    and this project wants those organizations as partners.
 *
 * No channel id below is invented. Where one is unknown it is left empty and
 * the note says so, because a wrong id fails silently or, worse, quietly
 * imports somebody else's videos under the wrong name.
 */

export type CatalogEntry = {
  slug: string;
  name: string;
  handle: string;
  description: string;
  kind: "YOUTUBE" | "RSS" | "BUILTIN_TEXT";
  feedRef?: string;
  siteUrl?: string;
  enabled: boolean;
  setupNote: string;
  hue: number;
  tags: string[];
};

export const SOURCE_CATALOG: CatalogEntry[] = [
  {
    slug: "daily-texts",
    name: "Daily Texts",
    handle: "sefaria",
    description:
      "Today's daf, today's mishnayos and this week's sedra, in Hebrew and translation, from Sefaria's open library.",
    kind: "BUILTIN_TEXT",
    siteUrl: "https://www.sefaria.org",
    enabled: true,
    setupNote: "",
    hue: 216,
    tags: ["daf-yomi", "mishnah-yomi", "parsha"],
  },
  {
    slug: "alldaf",
    name: "All Daf",
    handle: "alldaf",
    description:
      "The OU's Daf Yomi platform: daily shiurim, summaries and study aids for the whole cycle.",
    kind: "RSS",
    siteUrl: "https://www.alldaf.org",
    enabled: false,
    setupNote:
      "Needs a feed URL and the OU's permission. Check whether All Daf publishes an RSS or podcast feed, paste it here, and ask before switching this on.",
    hue: 26,
    tags: ["daf-yomi"],
  },
  {
    slug: "allmishnah",
    name: "All Mishnah",
    handle: "allmishnah",
    description: "The OU's Mishnah platform, following the Mishnah Yomi cycle.",
    kind: "RSS",
    siteUrl: "https://www.allmishnah.org",
    enabled: false,
    setupNote:
      "Needs a feed URL and the OU's permission, same as All Daf. Confirm the site publishes a feed before enabling.",
    hue: 44,
    tags: ["mishnah-yomi"],
  },
  {
    slug: "mdy",
    name: "Rabbi Eli Stefansky (MDY)",
    handle: "mdydaf",
    description:
      "The daily Daf Yomi shiur, posted to YouTube. Plays here through YouTube's own player, so views go to the channel.",
    kind: "YOUTUBE",
    siteUrl: "https://www.youtube.com/@MDYdaf",
    enabled: false,
    setupNote:
      "Needs the channel id. Open the channel, copy the UC... id from a /channel/ link or the page source, and paste it in Manage sources. Left blank on purpose rather than guessed.",
    hue: 348,
    tags: ["daf-yomi"],
  },
];
