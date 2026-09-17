# Torah Scroll

Replace doomscrolling with learning.

A working proof of concept for a social feed built out of Torah content: divrei Torah,
daily quizzes, video shiurim and diagrams, posted by individuals and organizations,
ranked against the Jewish calendar so that what you are actually learning today rises
to the top.

## Run it

Nothing external is required. No API keys, no hosted database, no network calls at runtime.

```bash
npm install
npm run setup     # generate client, create SQLite db, seed content
npm run dev       # http://localhost:3000
```

Sign in with `demo@torahscroll.test` / `demo1234`. Every seeded account uses the same
password, so you can sign in as `maggid@torahscroll.test`, `mkatz@torahscroll.test` and
so on to see the feed from a different person's side.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm run start` | Production build and server |
| `npm run db:reset` | Wipe and reseed against today's calendar |
| `npm run test:calendar` | Print the calendar engine's output for several dates |
| `npm run test:e2e` | Browser smoke test (needs a server already running) |

## What works

- **Email and password accounts.** Hashed with bcrypt, session in a signed httpOnly
  JWT cookie. Sign up, onboarding, sign in, sign out.
- **Four post types.** Dvar Torah, quiz (answer inline, explanation reveals), video
  (YouTube and Vimeo, embedded, loaded on click), and diagram.
- **Hearts, comments, follows.** All persisted, all feeding back into ranking.
- **Three feeds.** For You (ranked), Today's Learning (calendar matches only),
  Following (chronological).
- **Tag and profile pages**, and source references that deep-link to Sefaria.

## The calendar engine

`lib/calendar.ts` is the spine of the product. It computes, for any date and with no
network access:

- the Hebrew date, in English and in gematriya
- today's **Daf Yomi**
- today's **Mishnah Yomi**
- the coming Shabbos's **parsha**
- holidays within the next ten days, with how far away they are

This is built on `@hebcal/core` and `@hebcal/learning` rather than hand-rolled. Parsha
assignment in particular depends on leap years, year length and which festivals displace
a sedra; getting it subtly wrong in a Torah app is worse than not having the feature.

Verify it yourself with `npm run test:calendar`, which prints output across a leap year,
a festival and an Adar II date.

## How ranking works

`lib/feed.ts`. Deliberately a set of readable weights rather than a learned model, because
a Torah feed should be able to tell you why something reached you. Every term that adds
score also produces the reason string shown on the card.

| Signal | Weight |
| --- | --- |
| Post's source matches **today's daf** exactly | +62 |
| Post's source matches **today's Mishnah Yomi** chapter | +55 |
| Tagged with an **upcoming holiday** | up to +48, scaled by proximity |
| Tagged with **this week's parsha** | +44 |
| Author is someone you **follow** | +26 |
| **Tag affinity** from what you've hearted, answered and commented on | up to +36 |
| **Recency** | up to +20, half-life 3 days |
| **Engagement** | comments weighted higher than hearts |

Then:

- Posts you have already seen sink, but calendar matches have a higher floor. Today's
  daf is still today's daf on your second look at the feed.
- A diversity pass stops one account or one post format from taking three slots in a row.
- Rapid refreshes are not counted as separate views.

Comments are weighted above hearts on purpose. A conversation about a sugya is worth more
than a tap, which is the entire premise of the app.

## Deliberately not built yet

**Graduated exposure and moderation.** The concept: a new post goes first to a small inner
circle, and only widens to a larger audience if it is not flagged, expanding in tiers.
The database columns for it are already there (`Post.status`, `Post.reach`, `Post.flagCount`),
so it can be layered on without a migration, but none of it is implemented or surfaced.
Posts go live to everyone immediately. **This is the single biggest gap between this POC
and something you could open to the public.**

Also missing: image uploads (diagrams are referenced by URL, with six sample SVGs included),
real-time notifications, search, direct messages, and any pull from external APIs such as
Sefaria's text API.

## A note on the seeded organizations

Every account in the seed is fictional: The Maggid Institute, Shas Companion, Chavrusa Quiz
and the rest. The pitch involves onboarding real institutions, and real institutions should
write their own words. Inventing divrei Torah and attributing them to an actual organization
is not something a proof of concept should ship, so the seed demonstrates the shape of
organizational accounts without putting words in anyone's mouth.

The Torah content itself is real and checked, but treat it as demo material rather than as
a source to rely on.

## Stack

Next.js 15 (App Router, server actions) · TypeScript · Prisma · SQLite · Tailwind ·
`@hebcal/core` and `@hebcal/learning` · bcrypt and jose for auth · Playwright for the
smoke test.

SQLite was chosen so the thing runs anywhere with one command. Moving to Postgres is a
change to `prisma/schema.prisma` and `DATABASE_URL`, nothing more.

## Layout

```
app/            routes and server actions
components/     post card, feed chrome, client interactions
lib/
  calendar.ts   Hebrew date, Daf Yomi, Mishnah Yomi, parsha, holidays
  feed.ts       ranking, diversity pass, affinity updates
  auth.ts       password hashing, session cookie
  taxonomy.ts   the tag vocabulary
prisma/         schema and seed
public/diagrams six hand-built SVG diagrams used by the image posts
scripts/        calendar check and end-to-end browser test
```

Set `AUTH_SECRET` to a long random string before deploying anywhere real.
